#!/usr/bin/env node

/**
 * Test script to demonstrate AI-powered content cleansing
 * Usage: npx tsx src/app/scripts/testCleansing.ts
 */

import { config } from 'dotenv';
import path from 'path';
import { testContentCleansing } from './dataManagement';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

async function runTest() {
  console.log('🧪 Testing AI Content Cleansing\n');
  
  try {
    // Run the test
    const result = await testContentCleansing();
    
    console.log('\n🎉 Test completed successfully!');
    console.log(`📊 Content reduced by ${result.stats.reductionPercent}%`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest(); 