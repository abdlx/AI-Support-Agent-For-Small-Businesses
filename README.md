# AI Support Agent 🤖

> **Zendesk-lite for Small Businesses** — An open-source AI-powered customer support agent built with Next.js, OpenRouter, and LanceDB.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- **RAG-Powered Responses**: Upload your FAQs and knowledge base → AI answers questions using retrieved context
- **File Upload Support**: Drag-and-drop .txt, .md, or .csv files for instant knowledge base ingestion
- **Real-time Streaming**: Smooth, ChatGPT-like streaming responses
- **Knowledge Base Management**: Easy-to-use dashboard for managing documents
- **Modern UI**: Premium design with shadcn/ui components
- **Portable Stack**: SQLite + LanceDB — no cloud database required
- **OpenRouter Integration**: Access to 100+ LLM models through a single API

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js UI    │────▶│   API Routes    │────▶│   OpenRouter    │
│   (React)       │     │   (Node.js)     │     │   (LLM)         │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼───────┐
              │           │           │               │
              │  SQLite   │           │   LanceDB     │
              │  (Prisma) │           │   (Vectors)   │
              │           │           │               │
              └───────────┘           └───────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenRouter API Key ([Get one free](https://openrouter.ai/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-support-agent.git
   cd ai-support-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenRouter API key:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENROUTER_API_KEY="your-openrouter-api-key-here"
   OPENROUTER_MODEL="openai/gpt-4o-mini"
   ```

4. **Initialize the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage

### 1. Add Knowledge Base Documents

**Option A: Upload Files (Recommended)**
1. Go to the **Knowledge Base** tab
2. Click **Add Document**
3. Select the **Upload File** tab
4. Drag and drop a `.txt`, `.md`, or `.csv` file (or click to browse)
5. Optionally edit the auto-filled title
6. Click **Upload & Index**

**Option B: Manual Entry**
1. Go to the **Knowledge Base** tab
2. Click **Add Document**
3. Select the **Manual Entry** tab
4. Enter a title and paste your FAQ content
5. Click **Add Document**

The system will automatically chunk and embed the content.

### 2. Test the Chat

1. Switch to the **Chat Playground** tab
2. Ask questions based on your uploaded content
3. The AI will respond using retrieved context from your knowledge base

**Try the sample FAQ**: A `sample-faq.md` file is included in the project root for testing!

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | SQLite (Prisma ORM) |
| **Vector Store** | LanceDB (Embedded) |
| **AI Provider** | OpenRouter (OpenAI-compatible) |

---

## 📁 Project Structure

```
ai-support-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/          # Chat endpoint (RAG)
│   │   │   └── ingest/        # Document ingestion
│   │   ├── layout.tsx
│   │   └── page.tsx           # Main dashboard
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── chat-widget.tsx    # Chat interface
│   │   └── document-manager.tsx
│   └── lib/
│       ├── db.ts              # Prisma client
│       ├── openrouter.ts      # AI client
│       └── vector-store.ts    # LanceDB wrapper
├── prisma/
│   └── schema.prisma          # Database schema
├── .env.example
└── README.md
```

---

## 🔧 Configuration

### Changing the LLM Model

Edit `.env` to use a different model:

```env
# Use GPT-4o
OPENROUTER_MODEL="openai/gpt-4o"

# Use Claude 3.5 Sonnet
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"

# Use Llama 3.1
OPENROUTER_MODEL="meta-llama/llama-3.1-70b-instruct"
```

See [OpenRouter Models](https://openrouter.ai/models) for all available options.

---

## 🚀 Deployment

### Vercel (Recommended for Demo)

> ⚠️ **Note**: SQLite doesn't persist on Vercel's serverless functions. For production, consider migrating to PostgreSQL (Supabase/Neon).

For a quick demo deployment:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Self-Hosted

The portable SQLite + LanceDB stack makes self-hosting easy:

```bash
npm run build
npm start
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for unified LLM access
- [LanceDB](https://lancedb.com/) for embedded vector storage
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Prisma](https://prisma.io/) for database ORM

---

<p align="center">
  <b>Built with ❤️ as an open-source template for recruiters and developers</b>
</p>
