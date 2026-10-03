# AI Customer Support RAG

An AI-powered customer support application that uses **Retrieval-Augmented Generation (RAG)** to answer customer questions using company policies and documentation.

The application reads policy documents from PDFs, converts them into searchable vector representations using OpenAI embeddings, stores them in Pinecone, retrieves relevant information for each customer question, and uses an LLM to generate a grounded response.

## 🚀 Features

- 📄 PDF-based company knowledge base
- ✂️ Document chunking and token-based processing
- 🧠 OpenAI embeddings
- 🔎 Pinecone vector search
- 🤖 LLM-powered customer support
- 📚 RAG-based responses grounded in company documents
- 💬 Interactive customer support chat UI
- 🌙 Dark / light mode
- ⚡ Quick question suggestions
- 🔐 Environment-based API key configuration
- ❤️ Health check endpoint
- 🔌 REST API for customer questions

## 🏗️ Architecture

```text
                     Customer
                         │
                         ▼
                  ┌─────────────┐
                  │   Chat UI   │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Express API │
                  └──────┬──────┘
                         │
                         ▼
                 Generate Embedding
                         │
                         ▼
                  ┌─────────────┐
                  │   Pinecone  │
                  │ Vector DB   │
                  └──────┬──────┘
                         │
                    Relevant Chunks
                         │
                         ▼
                  ┌─────────────┐
                  │    OpenAI   │
                  │     LLM     │
                  └──────┬──────┘
                         │
                         ▼
                 Grounded Answer
                         │
                         ▼
                     Customer
```

## 🔄 RAG Pipeline

### Knowledge Ingestion

```text
PDF Documents
      ↓
PDF Parsing
      ↓
Text Extraction
      ↓
Chunking
      ↓
OpenAI Embeddings
      ↓
Pinecone
```

### Question Answering

```text
Customer Question
      ↓
Question Embedding
      ↓
Pinecone Similarity Search
      ↓
Relevant Policy Chunks
      ↓
LLM Context
      ↓
Grounded Response
```

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| JavaScript | Application development |
| Node.js | Backend runtime |
| Express.js | REST API and server |
| OpenAI | Embeddings and LLM responses |
| Pinecone | Vector database |
| pdf-parse | PDF text extraction |
| js-tiktoken | Token-based text processing |
| HTML | Frontend structure |
| CSS | Frontend styling |
| JavaScript | Frontend interactions |

## 📁 Project Structure

```text
Customer-Support-App/
│
├── knowledge/
│   ├── exchange-policy.pdf
│   ├── orders-account-help.pdf
│   ├── payment-refund-policy.pdf
│   ├── return-policy.pdf
│   └── shipping-delivery.pdf
│
├── index.html
├── index.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Paritosh008/Customer-Support-App.git
cd Customer-Support-App
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=shop-support
PINECONE_NAMESPACE=policies
```

Never commit `.env` to GitHub.

### 4. Start the application

```bash
npm start
```

The application will run at:

```text
http://localhost:3000
```

### 5. Health Check

Open:

```text
http://localhost:3000/health
```

The health endpoint can be used to verify that the backend is running.

## 🔌 API

### Query Customer Support

```http
GET /api/v1/query?question=Can%20I%20return%20a%20product%20after%2020%20days?
```

Example response:

```json
{
  "answer": "Most products may be returned within 30 calendar days from the date of delivery."
}
```

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Pinecone index name |
| `PINECONE_NAMESPACE` | Pinecone namespace |

## 🔒 Security

Sensitive credentials are stored using environment variables.

The following files and directories are excluded through `.gitignore`:

```text
.env
node_modules/
*.log
.vscode/
.idea/
```

API keys should never be hard-coded into the application or committed to GitHub.

## 💡 Example Questions

The application can answer questions such as:

```text
Can I return a product after 20 days?

How long does a refund take?

Can I exchange a different size?

How long is standard delivery?
```

The answers are generated using the information retrieved from the company policy documents.

## 🎯 Why RAG?

A normal LLM can generate an answer using its general training knowledge, but that knowledge may not contain a company's latest internal policies.

RAG solves this by providing the model with relevant company information at query time.

```text
Company Documents
       ↓
   Vector Search
       ↓
Relevant Context
       ↓
      LLM
       ↓
Grounded Answer
```

This helps reduce unsupported answers and keeps responses tied to the application's knowledge base.

## 🚧 Planned Production Improvements

The current application provides the core RAG pipeline. Planned improvements include:

- Conversation history and memory
- Source citations in responses
- Streaming AI responses
- User authentication
- PostgreSQL integration
- Admin knowledge-base dashboard
- Document upload and automatic indexing
- Document versioning
- Hybrid search
- Retrieval reranking
- RAG evaluation
- User feedback collection
- Analytics and monitoring
- Rate limiting and API security
- Docker containerization
- Cloud deployment

## 📌 Project Status

**Current Status:** Core RAG pipeline working

```text
PDF Ingestion       ✅
Text Chunking       ✅
OpenAI Embeddings   ✅
Pinecone Search     ✅
LLM Generation      ✅
Chat UI              ✅
Dark / Light Mode   ✅
GitHub Repository   ✅
Production Hardening 🚧
```

## 👨‍💻 Author

**Paritosh Chaudhary**

Generative AI Engineer | RAG | Agentic AI | LLM Applications

GitHub: [Paritosh008](https://github.com/Paritosh008)
