const fs = require('fs');
const path = require('path');

const results = JSON.parse(fs.readFileSync(path.join(__dirname, 'route_scan_results.json'), 'utf8'));

const noPerm = results.filter(r => r.permissions.length === 0 && r.anyPermissions.length === 0);

console.log('Endpoints without direct permission middleware categorized by file:');
const byFile = {};
for (const r of noPerm) {
  byFile[r.file] = (byFile[r.file] || 0) + 1;
}
console.log(byFile);

// Also let's list non-portal, non-auth endpoints without requirePermission:
const coreAdminNoPerm = noPerm.filter(r => !r.file.startsWith('portal-') && r.file !== 'auth.ts' && r.file !== 'health.ts');
console.log(`\nCore Admin endpoints without direct requirePermission: ${coreAdminNoPerm.length}`);
console.log(coreAdminNoPerm.map(r => `${r.file} [${r.method}] ${r.routePath} -> middlewares: "${r.middlewares}"`).join('\n'));
