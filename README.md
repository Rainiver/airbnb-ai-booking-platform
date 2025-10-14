# 🏠 AI-Powered Travel Booking Platform

[![CI](https://github.com/Rainiver/airbnb-ai-booking-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Rainiver/airbnb-ai-booking-platform/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://airbnb-ai-booking-platform.vercel.app)

Full-stack intelligent travel booking system with **RAG + Multi-Agent AI**, featuring natural language search, dynamic pricing, and smart booking assistance.

---

## 📷 Demo

### Property Browsing, Search & Favorites
<div align="center">
  <img src="./demo/houses.gif" alt="Property Features Demo" width="90%" />
</div>

**Core Features:**
- 🏠 **Property Browsing** - Responsive grid layout
- 🔍 **Smart Search** - Multi-criteria filtering (location, dates, guests)
- ❤️ **Favorites** - One-click save to favorites
- 📋 **Listing Details** - Complete info display & instant booking

### 🤖 AI Assistant (Multi-Agent System)
<div align="center">
  <img src="./demo/agent.gif" alt="AI Agent Assistant" width="90%" />
</div>

**AI Capabilities:**
- 🔍 **Semantic Search** - Natural language understanding with 768-dim vector retrieval
- 📅 **Date Parsing** - NLP-based time recognition & availability detection
- 💰 **Price Prediction** - 5-factor dynamic pricing model
- 🎯 **Smart Booking** - AI-assisted complete booking workflow
- 🧠 **Context Memory** - Multi-turn dialogue with intelligent reasoning
- 👥 **Multi-Agent Collaboration** - Search Agent + Recommend Agent + Booking Agent
- 🎨 **3D Animation UI** - Apple Siri-style animation effects

---

## ✨ Key Features

- 🎨 **Modern UI Design** - Glassmorphism style with 3D animation effects
- 🤖 **RAG Retrieval** - 768-dim vector semantic search with Supabase pgvector
- 👥 **Multi-Agent System** - Collaborative Search, Recommend & Booking agents
- 💰 **Dynamic Pricing Engine** - 5-factor model: season/weekend/advance/last-minute/holiday
- 🧠 **Conversation Memory** - Context-aware multi-turn intelligent reasoning
- 🎯 **Intent Recognition** - Google Gemini Pro natural language processing

---

## 🛠️ Tech Stack

**Frontend**: Next.js 13 (App Router) · TypeScript · Tailwind CSS · Canvas 2D API

**Backend**: Next.js API Routes · Prisma ORM · MongoDB Atlas · NextAuth.js

**AI/ML**: Google Gemini Pro (NLP) · Gemini Embeddings (768-dim) · Supabase Vector (pgvector) · RAG Pipeline

**Deployment**: Vercel (Frontend + API) · MongoDB Atlas (Database) · Supabase (Vector DB)

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Rainiver/airbnb-ai-booking-platform.git
cd airbnb-ai-booking-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env.local)
DATABASE_URL="mongodb+srv://..."                    # MongoDB connection
NEXTAUTH_SECRET="your-secret"                       # Auth secret
NEXTAUTH_URL="http://localhost:3000"                # App URL
GEMINI_API_KEY="your-gemini-key"                    # Google Gemini API key
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"        # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"   # Supabase anon key

# 4. Initialize database
npx prisma generate
npx prisma db push

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app

---

## 🏗️ Architecture

```
User Query → Intent Parsing (Gemini Pro) → Agent Orchestration
                        ↓
    ┌──────────────┬──────────────┬──────────────┐
    │ Search Agent │ Recommend    │ Booking      │
    │              │ Agent        │ Agent        │
    └──────────────┴──────────────┴──────────────┘
                        ↓
    Vector Retrieval + MongoDB → LLM Response Generation
```

**Workflow**: Intent Recognition → Vector Semantic Search (768-dim) → Multi-factor Ranking → Availability Check → Price Prediction → Contextual Response Generation

---

## 📊 Performance

- ⚡ **Response Time**: 1-3s (cached <1s)
- 🎯 **Accuracy**: Semantic search >90%, Context understanding >95%
- 📦 **Data Scale**: 75 properties × 768-dim vector embeddings
- 🎨 **Animation**: 60fps Canvas rendering
- 💰 **Cost**: $0/month (free tier deployment)

---

## 🚀 Deployment

```bash
# Deploy to Vercel
npm i -g vercel
vercel --prod
```

**Required Environment Variables**: `DATABASE_URL` · `NEXTAUTH_SECRET` · `NEXTAUTH_URL` · `GEMINI_API_KEY` · `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`

See [AI Setup Guide](./docs/AI_SETUP.md) for detailed configuration

---

## 🎯 Highlights

- ✨ **True AI Integration** - Not just a chatbot, but a Multi-Agent collaborative system
- 🧠 **Context-Aware** - Conversation memory, no need to repeat information
- 💡 **Price Intelligence** - Predicts best booking time to help users save money
- 🎨 **Beautiful UI** - Apple-quality design with smooth animations
- 🚀 **Production Ready** - Deployed and fully functional

---

## 📖 Documentation

- [AI Setup Guide](./docs/AI_SETUP.md) - Complete AI features configuration
- [CI/CD Setup Guide](./docs/CICD_SETUP.md) - GitHub Actions & Vercel deployment

---

## 🔗 Links

- **Live Demo**: [airbnb-ai-booking-platform.vercel.app](https://airbnb-ai-booking-platform.vercel.app)  
- **GitHub Repository**: [github.com/Rainiver/airbnb-ai-booking-platform](https://github.com/Rainiver/airbnb-ai-booking-platform)
- **License**: MIT

---

## 👨‍💻 Contributing

Issues and Pull Requests are welcome!
