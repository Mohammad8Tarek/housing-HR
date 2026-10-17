const fs = require('fs');
const path = require('path');

const routesDir = path.resolve(__dirname, '../../artifacts/api-server/src/routes');
const portalFiles = fs.readdirSync(routesDir).filter(f => f.startsWith('portal-'));

for (const file of portalFiles) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  console.log(`\n=== ${file} ===`);
  const lines = content.split('\n');
  // Check router-level middleware (router.use)
  const routerUses = lines.filter(l => l.includes('router.use('));
  if (routerUses.length > 0) {
    console.log('router.use:');
    routerUses.forEach(l => console.log('  ', l.trim()));
  }
  
  // Find all endpoints
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`])([\s\S]*?)(?:async|\(req|\(\s*_\s*req)/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const mws = match[3].replace(/\s+/g, ' ').trim();
    console.log(`  ${method} ${routePath} -> mws: ${mws}`);
  }
}
