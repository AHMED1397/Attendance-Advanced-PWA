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

  // Skip layouts
  if (filePath.endsWith('_layout.jsx')) return;

  let hasTextImport = false;
  
  // Replace import
  content = content.replace(/import\s+{([^}]*?)}\s+from\s+['"]react-native['"]/g, (match, imports) => {
    if (imports.includes('Text')) {
      hasTextImport = true;
      let newImports = imports.replace(/\bText\b,?/g, '').replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
      if (newImports.trim().length === 0) {
        return ''; // removed all imports
      }
      return `import { ${newImports} } from "react-native"`;
    }
    return match;
  });

  if (hasTextImport) {
      let depth = filePath.split(path.sep).length - directoryPath.split(path.sep).length;
      let importPath = '../'.repeat(depth) + 'components/AppText';
      content = `import AppText from '${importPath}';\n` + content;
  }

  // Replace components (even if import wasn't matched just in case)
  const originalContent = content;
  content = content.replace(/<Text\b/g, '<AppText');
  content = content.replace(/<\/Text>/g, '</AppText>');

  if (content !== originalContent || hasTextImport) {
      fs.writeFileSync(filePath, content);
      console.log('Updated: ' + filePath);
  }
}

walkDir(directoryPath);
console.log("Done");
