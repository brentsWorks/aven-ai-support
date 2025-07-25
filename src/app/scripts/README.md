# Data Management Scripts

This folder contains consolidated server actions for managing data operations in the Aven AI Support application.

## Files

- `dataManagement.ts` - Main consolidated script containing all data operations
- `run.js` - Simple runner script for command line execution
- `README.md` - This documentation file

## Command Line Usage

### Quick Start (Recommended)
```bash
# Run the complete data pipeline once
node src/app/scripts/run.js
```

### Alternative Methods
```bash
# Using tsx directly
npx tsx src/app/scripts/dataManagement.ts

# Using ts-node (if installed)
npx ts-node src/app/scripts/dataManagement.ts
```

### What the Script Does

The `main()` function runs a complete 4-step pipeline:

1. **🔍 Health Check** - Verifies all services (OpenAI, Pinecone, Firecrawl) are working
2. **🌐 Data Fetching** - Crawls and processes content from Aven website  
3. **🧠 Embedding & Storage** - Generates embeddings and stores in Pinecone
4. **✅ Verification** - Tests the stored data with a sample query

### Expected Output

```
🔧 Running Aven Data Management Script...

🚀 Starting Aven Data Management Pipeline
📊 Step 1: Running health check...
✅ All services are healthy
🌐 Step 2: Fetching data from Aven website...
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
    "durationMs": 127432,
    "healthStatus": {
      "openai": true,
      "pinecone": true,
      "firecrawl": true
    }
  }
}
```

## Programmatic Usage

### Import Functions

```typescript
import {
  // Main pipeline functions
  main,
  fetchData,
  fetchEmbedAndUpsert,
  upsertChunksToPinecone,
  upsertChunksToPineconeAction,
  
  // Utility functions
  getEmbedding,
  getEmbeddingsBatch,
  querySimilarContent,
  healthCheck
} from '@/app/scripts/dataManagement';
```

### Examples

#### 1. Run Complete Pipeline Programmatically
```typescript
// Run the full pipeline
const result = await main();
console.log(result); // { success: true, stats: {...} }
```

#### 2. Run Individual Steps
```typescript
// Just fetch and process data without storing
const chunks = await fetchData();
console.log(`Retrieved ${chunks.length} chunks`);
```

#### 3. Generate Embeddings
```typescript
// Single embedding
const embedding = await getEmbedding("How do I reset my password?");

// Batch embeddings
const embeddings = await getEmbeddingsBatch([
  "How do I reset my password?",
  "What are the fees?",
  "How to contact support?"
]);
```

#### 4. Query Similar Content
```typescript
// Find similar content in Pinecone
const results = await querySimilarContent("password reset help", 5);
console.log(results.matches);
```

#### 5. Health Check
```typescript
// Check if all services are working
const status = await healthCheck();
console.log(status); // { openai: true, pinecone: true, firecrawl: true }
```

## Prerequisites

### Environment Variables
```env
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

### Dependencies
Make sure you have these installed:
```bash
npm install tsx  # For TypeScript execution
# or
npm install ts-node  # Alternative TypeScript runner
```

## Function Categories

### 🔄 Pipeline Functions
- `main()` - **NEW** - Complete pipeline in one function call
- `fetchEmbedAndUpsert()` - Complete pipeline from fetch to store
- `fetchData()` - Fetch and process data from Aven website
- `upsertChunksToPinecone()` - Store chunks with embeddings
- `upsertChunksToPineconeAction()` - Server action wrapper

### 🧠 Embedding Functions  
- `getEmbedding(text)` - Generate single embedding
- `getEmbeddingsBatch(texts[])` - Generate multiple embeddings

### 🔍 Query Functions
- `querySimilarContent(query, topK)` - Find similar content
- `healthCheck()` - Check service status

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   # Make sure you're in the project root
   cd /path/to/your/project
   node src/app/scripts/run.js
   ```

2. **Environment variables not loaded**
   ```bash
   # Make sure .env file exists in project root
   cp .env.example .env
   # Add your API keys to .env
   ```

3. **TypeScript compilation errors**
   ```bash
   # Install dependencies
   npm install
   
   # Use tsx instead of ts-node
   npx tsx src/app/scripts/dataManagement.ts
   ```

## Migration from Old Actions

Replace old imports:
```typescript
// OLD
import { fetchData } from '@/app/actions/fetchData';
import { getEmbedding } from '@/app/actions/embedData';
import { upsertChunksToPinecone } from '@/app/actions/storeData';

// NEW - Single import
import { 
  main,           // NEW - run everything at once
  fetchData, 
  getEmbedding, 
  upsertChunksToPinecone 
} from '@/app/scripts/dataManagement';
```

All function signatures remain the same, so no code changes needed! 