# Aven AI Support

A modern Next.js application providing AI-powered voice and text support for Aven customers. The app features voice interaction through VAPI, intelligent responses using OpenAI and RAG (Retrieval Augmented Generation).

## 🌟 Overview

Aven AI Support is designed to provide instant customer support through both voice and text interactions. The application crawls and processes Aven's website content, creates embeddings for semantic search, and uses this knowledge base to provide accurate, contextual responses to customer inquiries.

### Key Features

- **🎤 Voice-First Interface** - Natural voice conversations powered by VAPI
- **💬 Text Chat Support** - Alternative text-based interaction mode
- **🧠 AI-Powered Responses** - OpenAI GPT models with RAG for accurate answers
- **📚 Knowledge Base** - Automated content crawling and processing from Aven website
- **🎨 Modern UI** - Clean, responsive interface built with Shadcn UI
- **⚡ Real-time Streaming** - Live response streaming for better UX

## 🏗️ Tech Stack

### Frontend

- **[Next.js 14](https://nextjs.org)** - React framework with App Router
- **[React 18](https://react.dev)** - UI library with Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Shadcn UI](https://ui.shadcn.com/)** - Modern component library
- **[Lucide React](https://lucide.dev)** - Beautiful icons

### AI & Voice

- **[VAPI](https://vapi.ai)** - Voice AI platform for natural conversations
- **[OpenAI](https://openai.com)** - GPT models for text generation and embeddings
- **[Vercel AI SDK](https://sdk.vercel.ai)** - AI integration and streaming utilities

### Data & Storage

- **[Pinecone](https://www.pinecone.io)** - Vector database for semantic search
- **[Firecrawl](https://firecrawl.dev)** - Web crawling and content extraction

### Development

- **[ESLint](https://eslint.org)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Environment variables (see setup below)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd aven-ai-support
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Required for script execution
   NODE_ENV=development

   # AI Services
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key

   # Data Services
   PINECONE_API_KEY=your_pinecone_api_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key

   # Voice AI (VAPI)
   NEXT_PUBLIC_VAPI_PUBLIC_API_KEY=your_vapi_public_key
   NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔄 Usage Flow

### For End Users

1. **🏠 Visit the Support Page** - Clean, welcoming interface
2. **🎤 Begin Call** - Voice-based support
3. **❓ Ask Your Question** - Ask a question about Aven
4. **🤖 Get Instant Answers** - AI-powered responses with relevant context
5. **✅ Problem Solved** - Quick resolution with human-like interaction

### For Developers

1. **📚 Data Preparation** - Run the data management script (one-time setup)
2. **🔧 Configure Services** - Set up API keys and environment variables
3. **🚀 Deploy Application** - Launch the support interface

## 📊 Data Management

### Automated Content Pipeline with AI Cleansing

The application includes a comprehensive data management system that processes Aven's website content with AI-powered content cleansing for optimal quality:

#### Quick Start - Run Data Pipeline

```bash
# One-time setup to populate knowledge base
node src/app/scripts/run.js
```

#### What the Pipeline Does

1. **🔍 Health Check** - Verifies needed services (OpenAI, Firecrawl, Pinecone)
2. **🌐 Content Crawling** - Extracts content from Aven website using Firecrawl
3. **🧹 AI Content Cleansing** - Uses GPT-4o to remove navigation noise while preserving expertise
4. **📦 Smart Chunking** - Creates semantic chunks from cleaned content
5. **🧠 Embedding Generation** - Creates vector embeddings for semantic search
6. **💾 Data Storage** - Stores processed content in Pinecone vector database
7. **✅ Verification** - Tests the knowledge base with sample queries

#### AI Content Cleansing

The pipeline uses GPT-4o to intelligently clean scraped content:

**📊 Typical Results:**
- **Content Reduction**: 20-30% (removes noise, keeps expertise)
- **Quality Improvement**: Much cleaner, more focused content
- **Better Embeddings**: Higher quality semantic search results

#### Alternative Execution Methods

```bash
# Using tsx directly
npx tsx src/app/scripts/dataManagement.ts

# Test content cleansing only
npx tsx src/app/scripts/testCleansing.ts

# Using ts-node
npx ts-node src/app/scripts/dataManagement.ts
```

#### Expected Output

```
🔧 Running Aven Data Management Script...

🚀 Starting Aven Data Management Pipeline
📊 Step 1: Running health check...
✅ All services are healthy
🌐 Step 2: Fetching data from Aven website...
🧹 Cleansing content for: How It Works
✨ Cleaned content: 2239 → 1720 chars
✅ Processed: https://www.aven.com/education
📦 Successfully fetched 45 chunks
🧠 Step 3: Generating embeddings and storing in Pinecone...
🔍 Step 4: Verifying data storage with test query...
🎉 Pipeline completed successfully!

✅ Script completed successfully!
📊 Results: {
  "success": true,
  "message": "Successfully processed 45 chunks in 127s",
  "stats": {
    "chunksProcessed": 45,
    "testQueryResults": 3,
    "durationMs": 127432
  }
}
```

### Individual Functions

The data management script provides modular functions for specific tasks:

```typescript
import {
  // Main pipeline
  main,

  // Individual steps
  fetchData,
  getEmbedding,
  upsertChunksToPinecone,
  querySimilarContent,
  healthCheck,
  testContentCleansing,
  verifyPineconeData,
} from "@/app/scripts/dataManagement";

// Run complete pipeline
const result = await main();

// Test AI content cleansing
const cleansingResult = await testContentCleansing();

// Verify Pinecone data
const pineconeData = await verifyPineconeData();

// Or use individual functions
const chunks = await fetchData();
const embedding = await getEmbedding("How do I reset my password?");
const results = await querySimilarContent("password help", 5);
```

### Content Processing Workflow

The optimized workflow processes content efficiently:

1. **🌐 Crawl Page** - Extract raw content from Aven website
2. **🧹 Clean Content** - AI-powered cleansing (1 API call per page)
3. **📦 Create Chunks** - Semantic chunking of cleaned content
4. **🧠 Generate Embeddings** - Vector embeddings for search
5. **💾 Store in Pinecone** - Index for RAG retrieval

This approach ensures maximum efficiency with minimal API calls while maintaining high content quality.

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── Window.tsx       # Main application interface
│   │   └── VoiceWidget.tsx  # VAPI voice interaction component
│   ├── api/
│   │   └── chat/           # Chat API endpoints
│   │       └── completions/
│   │           └── route.ts # OpenAI streaming chat endpoint
│   └── scripts/            # Data management scripts
│       ├── dataManagement.ts # Main data pipeline script
│       ├── run.js          # Script runner
│       └── README.md       # Script documentation
├── components/ui/          # Shadcn UI components
├── config/
│   └── env.ts             # Environment variable validation
├── lib/
│   └── utils.ts           # Utility functions and RAG helpers
└── utils/
    └── logger.ts          # Logging utility
```

## 🔧 Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Data Management

- `node src/app/scripts/run.js` - Run complete data pipeline
- `npx tsx src/app/scripts/dataManagement.ts` - Direct script execution

## 🚢 Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**

   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**

   Configure all required environment variables in the Vercel dashboard

3. **Run Data Pipeline**

   Execute the data management script to populate the knowledge base

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [VAPI](https://vapi.ai) for voice AI capabilities
- [OpenAI](https://openai.com) for language models
- [Vercel](https://vercel.com) for deployment and AI SDK
- [Shadcn](https://ui.shadcn.com) for beautiful UI components
