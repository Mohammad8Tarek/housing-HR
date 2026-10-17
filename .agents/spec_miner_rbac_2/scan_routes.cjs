const fs = require('fs');
const path = require('path');

const routesDir = path.resolve(__dirname, '../../artifacts/api-server/src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const results = [];

for (const file of files) {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Also check if router has a prefix when mounted in routes/index.ts
  // Regex to match router methods:
  // router.get('/...', ...
  // app.get('/...', ...
  const lines = content.split('\n');
  const routeRegex = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`])/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2].slice(1, -1);
    const matchIndex = match.index;
    
    // Find the end of this router call's middleware/handler start (up to async or (req or next)
    const afterMatch = content.slice(matchIndex + match[0].length, matchIndex + match[0].length + 500);
    const handlerStart = afterMatch.search(/(?:async\s*\(|\(\s*(?:req|_req|res|_res)\s*[,:\)])/);
    const middlewareChunk = handlerStart !== -1 ? afterMatch.slice(0, handlerStart) : afterMatch.split('\n')[0];

    // Check for requirePermission
    const permMatches = [...middlewareChunk.matchAll(/requirePermission\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g)];
    const perms = permMatches.map(m => `${m[1]}.${m[2]}`);

    // Check for requireAnyPermission
    const anyPermMatches = [...middlewareChunk.matchAll(/requireAnyPermission\(([\s\S]*?)\)/g)];
    const anyPerms = [];
    if (anyPermMatches.length > 0) {
      for (const ap of anyPermMatches) {
        const pairs = [...ap[1].matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g)];
        anyPerms.push(pairs.map(p => `${p[1]}.${p[2]}`).join(' OR '));
      }
    }

    const hasRequireAuth = middlewareChunk.includes('requireAuth');
    const hasAdminOnly = content.slice(matchIndex, matchIndex + 1500).includes('isSystemAdmin') ||
                         content.slice(matchIndex, matchIndex + 1500).includes('super_admin') ||
                         middlewareChunk.includes('super_admin');

    // Check tenant isolation in this endpoint
    const endpointSnippet = content.slice(matchIndex, matchIndex + 2500);
    const usesWithTenant = endpointSnippet.includes('withTenant(');
    const usesGetTenantId = endpointSnippet.includes('getTenantId(');
    const usesSearchPath = endpointSnippet.includes('search_path');
    const directDbAccess = endpointSnippet.includes('db.') || endpointSnippet.includes('pool.');

    results.push({
      file,
      method,
      routePath,
      middlewares: middlewareChunk.trim().replace(/,\s*$/, '').replace(/\s+/g, ' '),
      permissions: perms,
      anyPermissions: anyPerms,
      requireAuth: hasRequireAuth,
      superAdminOrAdminCheck: hasAdminOnly,
      tenantIsolation: {
        usesWithTenant,
        usesGetTenantId,
        usesSearchPath,
        directDbAccess
      }
    });
  }
}

console.log(`Total endpoints parsed: ${results.length}`);
fs.writeFileSync(path.join(__dirname, 'route_scan_results.json'), JSON.stringify(results, null, 2));

// Summary statistics
const withPerm = results.filter(r => r.permissions.length > 0 || r.anyPermissions.length > 0);
console.log(`Endpoints with requirePermission / requireAnyPermission: ${withPerm.length}`);
console.log(`Endpoints without direct permission middleware: ${results.length - withPerm.length}`);
