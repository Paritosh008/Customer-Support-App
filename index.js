import "dotenv/config";

import express from "express";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Pinecone } from "@pinecone-database/pinecone";
import { getEncoding } from "js-tiktoken";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------
// Configuration
// ----------------------------------------

const KNOWLEDGE_DIR = path.resolve(__dirname, "knowledge");

const INDEX_NAME =
  process.env.PINECONE_INDEX_NAME ?? "shop-support";

const NAMESPACE =
  process.env.PINECONE_NAMESPACE ?? "policies";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1024;

const CHAT_MODEL = "gpt-5-mini";

const CHUNK_SIZE = 300;
const TOP_K = 6;

// ----------------------------------------
// API Keys
// ----------------------------------------

function requireKey(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Please add it to your .env file.`,
    );
  }

  return value;
}

const openai = new OpenAI({
  apiKey: requireKey("OPENAI_API_KEY"),
});

const pinecone = new Pinecone({
  apiKey: requireKey("PINECONE_API_KEY"),
});

const pineconeIndex = pinecone
  .index(INDEX_NAME)
  .namespace(NAMESPACE);

const tokenizer = getEncoding("cl100k_base");

// ----------------------------------------
// Text Chunking
// ----------------------------------------

function splitIntoTokenChunks(
  text,
  chunkSize = CHUNK_SIZE,
) {
  const tokens = tokenizer.encode(text);

  const chunks = [];

  for (
    let start = 0;
    start < tokens.length;
    start += chunkSize
  ) {
    const chunk = tokenizer
      .decode(tokens.slice(start, start + chunkSize))
      .trim();

    if (chunk) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

// ----------------------------------------
// Read PDF Knowledge Base
// ----------------------------------------

async function readKnowledgeBase() {
  const fileNames = (await readdir(KNOWLEDGE_DIR))
    .filter((name) =>
      name.toLowerCase().endsWith(".pdf"),
    )
    .sort();

  if (fileNames.length === 0) {
    throw new Error(
      `No PDF files found inside: ${KNOWLEDGE_DIR}`,
    );
  }

  const chunks = [];

  for (const fileName of fileNames) {
    const filePath = path.join(
      KNOWLEDGE_DIR,
      fileName,
    );

    console.log(`Reading PDF: ${fileName}`);

    const parser = new PDFParse({
      data: await readFile(filePath),
    });
    
    const result = await parser.getText();
    
    await parser.destroy();
    
    const parsed = {
      text: result.text,
    };

    splitIntoTokenChunks(parsed.text).forEach(
      (text, chunkNumber) => {
        chunks.push({
          text,
          metadata: {
            source: fileName,
            chunk: chunkNumber,
          },
        });
      },
    );
  }

  return chunks;
}

// ----------------------------------------
// Stable Vector ID
// ----------------------------------------

function stableId(chunk) {
  return createHash("sha256")
    .update(
      `${chunk.metadata.source}:${chunk.metadata.chunk}:${chunk.text}`,
    )
    .digest("hex");
}

// ----------------------------------------
// Load PDF into Pinecone
// ----------------------------------------

export async function loadKnowledgeBase() {
  const chunks = await readKnowledgeBase();

  console.log(
    `Found ${chunks.length} knowledge chunks.`,
  );

  const batchSize = 100;

  for (
    let start = 0;
    start < chunks.length;
    start += batchSize
  ) {
    const batch = chunks.slice(
      start,
      start + batchSize,
    );

    console.log(
      `Embedding chunks ${start + 1} - ${
        start + batch.length
      }`,
    );

    const embeddingResponse =
      await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map(
          (chunk) => chunk.text,
        ),
        dimensions: EMBEDDING_DIMENSIONS,
      });

    const records = batch.map(
      (chunk, index) => ({
        id: stableId(chunk),

        values:
          embeddingResponse.data[index]
            .embedding,

        metadata: {
          ...chunk.metadata,
          text: chunk.text,
        },
      }),
    );

    await pineconeIndex.upsert({
      records,
    });
  }

  console.log(
    `Successfully loaded ${chunks.length} chunks into Pinecone.`,
  );

  return chunks.length;
}

// ----------------------------------------
// RAG Question Answering
// ----------------------------------------

export async function answerUserQuery(
  question,
) {
  // 1. Convert question to embedding
  const queryEmbedding =
    await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
      dimensions: EMBEDDING_DIMENSIONS,
    });

  // 2. Search Pinecone
  const searchResult =
    await pineconeIndex.query({
      vector:
        queryEmbedding.data[0].embedding,

      topK: TOP_K,

      includeMetadata: true,
    });

  // 3. Extract relevant chunks
  const context = searchResult.matches
    .map(
      (match) =>
        match.metadata?.text,
    )
    .filter(Boolean)
    .join("\n\n");

  console.log("\n--- RETRIEVED CONTEXT ---");
console.log(context);
console.log("--- END CONTEXT ---\n");

  // 4. Send retrieved context to LLM
  const instructions = `
You are an AI customer support assistant for our e-commerce company.

Answer the customer using ONLY the company information provided below.

If the answer is not available in the provided information, say:

"I don't have that information in the company documents."

Do not invent information.

COMPANY INFORMATION:

${context}
`;

  // 5. Generate answer
  const response =
    await openai.responses.create({
      model: CHAT_MODEL,

      instructions,

      input: question,
    });

  return response.output_text;
}

// ----------------------------------------
// Express Server
// ----------------------------------------

const app = express();

app.use(express.json());

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html"),
  );
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RAG Customer Support",
  });
});

// RAG API
app.get("/api/v1/query", async (req, res) => {
  try {
    const question = req.query.question;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        error:
          "question query parameter is required.",
      });
    }

    console.log(
      `Question: ${question}`,
    );

    const answer =
      await answerUserQuery(
        question,
      );

    res.json({
      answer,
    });
  } catch (error) {
    console.error(
      "RAG error:",
      error,
    );

    res.status(500).json({
      error:
        "Failed to process the question.",
    });
  }
});

// ----------------------------------------
// Start Server
// ----------------------------------------

const PORT =
  process.env.PORT || 3000;

  app.listen(PORT, async () => {
    console.log("");
    console.log("====================================");
    console.log("ShopSphere RAG Customer Support");
    console.log("====================================");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log("");
  
    try {
      await loadKnowledgeBase();
      console.log("Knowledge base is ready.");
    } catch (error) {
      console.error("Failed to load knowledge base:");
      console.error(error);
    }
  });