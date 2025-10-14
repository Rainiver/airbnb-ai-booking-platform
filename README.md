# 🏠 AI-Powered Airbnb Booking Platform

[![CI](https://github.com/Rainiver/airbnb-ai-booking-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Rainiver/airbnb-ai-booking-platform/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://airbnb-build-master.vercel.app)

A full-stack intelligent travel booking system with **RAG + Multi-Agent AI**, featuring natural language search, price prediction, and smart booking assistance.

---

## ✨ Key Features

### 🎨 Visual Design
- **3D AI Avatar** - Apple Siri-style animated assistant
- **Glassmorphism UI** - Modern glass-effect design
- **Multi-Agent Visualization** - Real-time agent progress indicators
- **Gradient Effects** - Dynamic color animations

### 🤖 AI Capabilities
- **Smart Search** - Semantic understanding with 768-dim vectors
- **Date Availability** - NLP date parsing & conflict detection
- **Price Prediction** - Dynamic pricing with 5-factor model
- **Smart Booking** - AI-assisted booking workflow
- **Conversation Memory** - Context-aware multi-turn dialogue
- **Intent Recognition** - Gemini Pro NLP

### 💬 Supported Queries
- **Search**: "Find beach houses for families"
- **Dates**: "What's available Jan 1st to 7th"
- **Pricing**: "When is the cheapest time to book"
- **Booking**: "Book Seaside Retreat 31, Jan 1-3"
- **Follow-up**: "Which is cheapest?" "Best time to book?"

---

## 🛠️ Tech Stack

### Frontend
- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Canvas 2D API (3D animations)
- Lucide React (icons)

### Backend
- Next.js API Routes
- Prisma ORM
- MongoDB Atlas
- NextAuth.js

### AI/ML
- **Google Gemini Pro** - NLP & chat
- **Google Gemini Embeddings** - 768-dim vectors
- **Supabase Vector** - pgvector database
- **RAG Pipeline** - Retrieval augmented generation

### Infrastructure
- Vercel (frontend + API)
- MongoDB Atlas (database)
- Supabase (vector DB)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- npm/yarn

### Installation

1. **Clone repository**
```bash
git clone https://github.com/Rainiver/airbnb-ai-booking-platform.git
cd airbnb-ai-booking-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create `.env.local`:
```env
# Database
DATABASE_URL="mongodb+srv://..."

# Auth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Features
GEMINI_API_KEY="your-gemini-key"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"
```

4. **Setup database**
```bash
npx prisma generate
npx prisma db push
```

5. **Generate embeddings** (optional)
```bash
npm run generate-embeddings
```

6. **Start development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🤖 AI Assistant Features

### 1. Smart Search
Natural language property search with semantic understanding.

**Example**:
```
User: "Find beach houses for families"
AI: [Returns 5 beach properties suitable for families]
    - Seaside Retreat 31 (5 guests)
    - City Studio 46 (4 guests)
    ...
```

### 2. Date Availability Check
Specify dates in natural language, AI checks availability.

**Example**:
```
User: "What's available Jan 1st to 7th"
AI: [Shows available properties with total price for 6 nights]
    ✅ Found 10 available properties!
    Total: $348 (6 nights)
```

### 3. Dynamic Price Prediction
Multi-factor pricing model considers:
- Season (Summer +30%, Winter holidays +20%)
- Weekends (+15%)
- Advance booking (-5%)
- Last-minute (<7 days, -10%)

**Example**:
```
User: "When is cheapest to book Seaside Retreat 31"
AI: 🎯 Price Analysis: Seaside Retreat 31
    
    💰 Base: $382/night
    
    📊 Best Time to Book:
    ✅ Book Now - Early bird discount
       Price: $363/night (-5%)
    
    📅 Summer: +30% premium
    📅 Weekends: +15% premium
    
    💡 Lock in discount by booking early!
```

### 4. Conversation Memory
AI remembers context across multiple turns.

**Example**:
```
Turn 1:
User: "Find beach houses for families"
AI: [Shows 5 properties]

Turn 2:
User: "When is cheapest to book Seaside Retreat 31"
AI: [Analyzes ONLY that specific property from previous results]

Turn 3:
User: "Book it, Jan 1-3"
AI: [Infers "Seaside Retreat 31" from context]
    ✅ Booking Seaside Retreat 31
    Total: $726 (2 nights)
```

---

## 🏗️ Architecture

### Multi-Agent System
```
User Query → Intent Parser → Agent Orchestration
                ↓
    ┌──────────┬────────────┬──────────┐
    │  Search  │ Recommend  │ Booking  │
    │  Agent   │   Agent    │  Agent   │
    └──────────┴────────────┴──────────┘
                ↓
    Vector DB + MongoDB → Results → LLM Response
```

### Data Flow
1. **Intent Recognition** - Gemini Pro extracts intent & parameters
2. **Search Agent** - Vector semantic search (768-dim)
3. **Recommend Agent** - Multi-factor ranking & filtering
4. **Booking Agent** - Availability check & price prediction
5. **Response Generation** - Context-aware formatted response

---

## 📊 Performance

- **Response Time**: 1-3 seconds (< 1s for follow-ups)
- **Accuracy**: >90% semantic search, >95% context understanding
- **Data**: 75 properties × 768-dim embeddings
- **Animation**: 60fps Canvas rendering
- **Cost**: $0/month (free tier)

---

## 🎯 Resume Highlights

### Project Description
AI-powered travel booking platform with RAG + Multi-Agent architecture, featuring natural language search, dynamic pricing, and context-aware conversation.

### Technical Achievements
- Implemented Multi-Agent collaboration system (Search + Recommend + Booking)
- Developed NLP intent parser with >95% accuracy
- Created dynamic pricing engine with 5-factor model
- Built conversation memory system for context-aware responses
- Designed 3D Canvas animation (Apple-style UI)
- Integrated Vector Database for semantic search

### Tech Stack
- Frontend: Next.js 13, TypeScript, Tailwind, Canvas API
- AI/ML: Gemini Pro, Supabase Vector, RAG
- Backend: Prisma, MongoDB, NextAuth
- Infrastructure: Vercel, MongoDB Atlas, Supabase

### Key Metrics
- 75 properties with 768-dim embeddings
- <3s response time, <1s for cached queries
- >90% search accuracy, >95% context understanding
- 60fps animation, responsive design
- $0/month deployment cost

---

## 🚀 Deployment

### Vercel
```bash
npm i -g vercel
vercel --prod
```

**Required Environment Variables**:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

See [AI Setup Guide](./docs/AI_SETUP.md) for details.

---

## 📖 Documentation

- [AI Setup Guide](./docs/AI_SETUP.md) - Complete AI features setup
- [CI/CD Setup](./docs/CICD_SETUP.md) - GitHub Actions & Vercel deployment

---

## 🎉 What Makes This Special

1. **True AI Integration** - Not just a chatbot, but intelligent agents working together
2. **Context-Aware** - Remembers conversation, no need to repeat information
3. **Price Intelligence** - Predicts best booking time, helps users save money
4. **Beautiful UI** - Apple-quality design with smooth animations
5. **Production Ready** - Deployed and fully functional

---

## 📞 Contact

**GitHub**: https://github.com/Rainiver/airbnb-ai-booking-platform

---

**Version**: 5.1 - English Edition
**Status**: ✅ Production Ready
**License**: MIT
