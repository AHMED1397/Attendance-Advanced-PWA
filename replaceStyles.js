const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Dark Mode replacements
  content = content.replace(/\bbg-white\b/g, 'bg-surface');
  content = content.replace(/\bbg-gray-100\b/g, 'bg-background');
  content = content.replace(/\bbg-gray-50\b/g, 'bg-background');
  content = content.replace(/\btext-gray-800\b/g, 'text-text-main');
  content = content.replace(/\btext-gray-900\b/g, 'text-text-main');
  content = content.replace(/\btext-gray-700\b/g, 'text-text-main');
  content = content.replace(/\btext-gray-[456]00\b/g, 'text-text-sub');
  content = content.replace(/\bbg-[#E0F7FA]\b/g, 'bg-background');

  // Primary Color replacements (Charts/Tables)
  content = content.replace(/\bbg-sky-600\b/g, 'bg-primary');
  content = content.replace(/\bbg-sky-400\b/g, 'bg-primary-dark'); // Actually 400 is lighter than 600 but in their code they used 400 for headers. Let's map both to primary or dark.
  content = content.replace(/\bbg-sky-100\b/g, 'bg-primary-light');
  content = content.replace(/\bbg-sky-50\b/g, 'bg-primary-light');
  content = content.replace(/\bborder-sky-[34]00\b/g, 'border-primary');
  content = content.replace(/\btext-sky-700\b/g, 'text-primary-dark');
  content = content.replace(/\btext-sky-600\b/g, 'text-primary-dark');
  content = content.replace(/\btext-sky-200\b/g, 'text-primary-light');
  // Also summary screen has bg-green-500, let's make it primary
  content = content.replace(/\bbg-green-500\b/g, 'bg-primary');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Updated classes in: ' + filePath);
  }
}

walkDir(directoryPath);
console.log("Done replacing classes.");
