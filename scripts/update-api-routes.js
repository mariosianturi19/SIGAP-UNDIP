/**
 * Batch Update Script untuk API Routes
 * Script ini akan update semua API routes untuk menggunakan environment variables
 */

const fs = require('fs');
const path = require('path');

// Template untuk replace hardcoded URL dan console.log
const replacements = [
  {
    pattern: /https:\/\/sigap-api-5hk6r\.ondigitalocean\.app\/api/g,
    replacement: (match, filePath) => {
      // Extract the endpoint path from context
      return 'buildApiUrl'; // Will be handled contextually
    }
  },
  {
    pattern: /console\.log\(/g,
    replacement: 'log('
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logError('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logWarn('
  }
];

// Function to add imports if not present
function addImportsIfNeeded(content) {
  if (!content.includes('buildApiUrl') && !content.includes('@/lib/apiConfig')) {
    // Find the import section
    const importMatch = content.match(/import.*from.*["'];?\n/);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
      const newImport = 'import { buildApiUrl, log, logError, logWarn } from "@/lib/apiConfig";\n';
      content = content.slice(0, lastImportIndex) + newImport + content.slice(lastImportIndex);
    }
  }
  return content;
}

// Function to replace hardcoded URLs with buildApiUrl
function replaceHardcodedUrls(content) {
  // Pattern 1: Simple fetch with full URL
  content = content.replace(
    /fetch\("https:\/\/sigap-api-5hk6r\.ondigitalocean\.app\/api([^"]+)"/g,
    (match, endpoint) => {
      return `fetch(buildApiUrl("${endpoint}")`;
    }
  );

  // Pattern 2: URLs in endpoint arrays
  content = content.replace(
    /"https:\/\/sigap-api-5hk6r\.ondigitalocean\.app\/api([^"]+)"/g,
    (match, endpoint) => {
      return `buildApiUrl("${endpoint}")`;
    }
  );

  return content;
}

// Function to replace console statements
function replaceConsoleStatements(content) {
  // Replace console.log with conditional log
  content = content.replace(/console\.log\(/g, 'log(');

  // Replace console.error with logError (always logs)
  content = content.replace(/console\.error\(/g, 'logError(');

  // Replace console.warn with logWarn
  content = content.replace(/console\.warn\(/g, 'logWarn(');

  return content;
}

// Main processing function
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Check if file needs updating
    if (!content.includes('sigap-api-5hk6r.ondigitalocean.app') &&
        !content.includes('console.log') &&
        !content.includes('console.error')) {
      console.log(`✓ Skipping ${filePath} (already updated)`);
      return false;
    }

    console.log(`📝 Updating ${filePath}...`);

    // Add imports
    content = addImportsIfNeeded(content);

    // Replace hardcoded URLs
    content = replaceHardcodedUrls(content);

    // Replace console statements
    content = replaceConsoleStatements(content);

    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all route.ts files in api directory
function findApiRoutes(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findApiRoutes(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  }

  return results;
}

// Main execution
function main() {
  console.log('🚀 Starting API Routes Update...\n');

  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

  if (!fs.existsSync(apiDir)) {
    console.error('❌ API directory not found:', apiDir);
    process.exit(1);
  }

  const routeFiles = findApiRoutes(apiDir);
  console.log(`Found ${routeFiles.length} API route files\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const file of routeFiles) {
    const relativePath = path.relative(process.cwd(), file);
    if (processFile(file)) {
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updatedCount} files`);
  console.log(`⏭️  Skipped: ${skippedCount} files`);
  console.log(`📁 Total: ${routeFiles.length} files`);
  console.log('\n✨ Done!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, findApiRoutes };
