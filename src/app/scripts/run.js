#!/usr/bin/env node

/**
 * Simple runner script for the data management pipeline
 * Usage: node src/app/scripts/run.js
 */

const { execSync } = require("child_process");
const path = require("path");

console.log("🚀 Aven Data Management Script Runner");
console.log("=====================================\n");

try {
  // Change to project root
  const projectRoot = path.resolve(__dirname, "../../../");
  process.chdir(projectRoot);

  console.log("📂 Project root:", projectRoot);
  console.log("🔧 Running TypeScript compilation and execution...\n");

  // Run the script using tsx (TypeScript execution)
  execSync("npx tsx src/app/scripts/dataManagement.ts", {
    stdio: "inherit",
    cwd: projectRoot,
  });
} catch (error) {
  console.error("\n❌ Script execution failed!");
  console.error("💥 Error:", error.message);
  process.exit(1);
}
