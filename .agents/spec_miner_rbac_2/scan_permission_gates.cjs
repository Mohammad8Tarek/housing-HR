const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../artifacts/housing/src');

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles(srcDir);
const results = [];

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('PermissionGate')) continue;

  // Match <PermissionGate ... > ... </PermissionGate> or self-closing
  // Let's use regex to capture module and action
  const gateRegex = /<PermissionGate\s+([^>]*?)>([\s\S]*?)<\/PermissionGate>/g;
  let match;
  while ((match = gateRegex.exec(content)) !== null) {
    const propsStr = match[1];
    const childrenStr = match[2].trim();
    const matchIndex = match.index;

    // Calculate line number
    const lineNum = content.slice(0, matchIndex).split('\n').length;

    const moduleMatch = propsStr.match(/module\s*=\s*["']([^"']+)["']/);
    const actionMatch = propsStr.match(/action\s*=\s*["']([^"']+)["']/);

    // Identify what control is wrapped
    let controlType = 'Unknown';
    if (childrenStr.includes('<Button')) controlType = 'Button';
    else if (childrenStr.includes('<DropdownMenuItem')) controlType = 'DropdownMenuItem';
    else if (childrenStr.includes('<TabsTrigger')) controlType = 'TabsTrigger';
    else if (childrenStr.includes('<Switch')) controlType = 'Switch';
    else if (childrenStr.includes('<Dialog') || childrenStr.includes('<Modal')) controlType = 'Dialog/Modal';
    else if (childrenStr.includes('<Card') || childrenStr.includes('<div')) controlType = 'Card/Section';
    else if (childrenStr.includes('<Select')) controlType = 'Select';
    else if (childrenStr.includes('<Input')) controlType = 'Input';

    // Try to extract button text or label or icon
    let label = '';
    const textMatch = childrenStr.match(/>([^<>{}\n\r]+)</);
    if (textMatch && textMatch[1].trim()) {
      label = textMatch[1].trim();
    } else {
      const arEnMatch = childrenStr.match(/ar\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/);
      if (arEnMatch) {
        label = `AR: "${arEnMatch[1]}" / EN: "${arEnMatch[2]}"`;
      } else {
        const titleMatch = childrenStr.match(/title\s*=\s*["']([^"']+)["']/);
        if (titleMatch) label = titleMatch[1];
        else {
          const firstLine = childrenStr.split('\n')[0].slice(0, 60);
          label = firstLine;
        }
      }
    }

    const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/');

    results.push({
      file: relPath,
      line: lineNum,
      module: moduleMatch ? moduleMatch[1] : 'DYNAMIC',
      action: actionMatch ? actionMatch[1] : 'DYNAMIC',
      controlType,
      label: label.replace(/\s+/g, ' ').trim(),
      snippet: childrenStr.slice(0, 150).replace(/\s+/g, ' ').trim()
    });
  }
}

console.log(`Total PermissionGates found: ${results.length}`);
fs.writeFileSync(path.join(__dirname, 'permission_gate_scan.json'), JSON.stringify(results, null, 2));

// Summary by module.action
const byModuleAction = {};
for (const r of results) {
  const key = `${r.module}.${r.action}`;
  byModuleAction[key] = (byModuleAction[key] || 0) + 1;
}
console.log('Permission Gates by module.action:');
console.log(byModuleAction);
