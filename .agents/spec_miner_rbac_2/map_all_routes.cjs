const fs = require('fs');
const path = require('path');

const routesDir = path.resolve(__dirname, '../../artifacts/api-server/src/routes');

// Router prefix map from routes/index.ts
const ROUTE_PREFIXES = {
  'hr-sync.ts': '/hr-sync',
  'documents.ts': '/documents',
  'hotek-config.ts': '/hotek',
  'jobs.ts': '/jobs',
  'reports.ts': '/reports',
  'portal-auth.ts': '/portal-auth',
  'portal-data.ts': '/portal-data',
  'portal-analytics.ts': '/portal-analytics',
  'portal-notifications.ts': '/portal-notifications',
  'portal-categories.ts': '/portal-categories',
  'portal-feedback.ts': '/portal-feedback',
  'portal-reports.ts': '/portal-reports',
  'portal-schedule.ts': '/portal-schedule',
  'push-notifications.ts': '/push',
  'portal-food-transport.ts': '/portal-food',
  'portal-chat.ts': '/portal-chat'
};

const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
const allRoutes = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const prefix = ROUTE_PREFIXES[file] || '';
  
  // Find route definitions
  const routeRegex = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`])/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    let rawPath = match[2].slice(1, -1);
    
    // Combine prefix and rawPath
    let fullPath = rawPath;
    if (prefix) {
      if (rawPath === '/') fullPath = prefix;
      else fullPath = prefix + (rawPath.startsWith('/') ? rawPath : '/' + rawPath);
    }
    
    // Normalize path to always start with /api if needed, or relative to /api
    if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;

    const matchIndex = match.index;
    const afterMatch = content.slice(matchIndex + match[0].length, matchIndex + match[0].length + 600);
    const handlerStart = afterMatch.search(/(?:async\s*\(|\(\s*(?:req|_req|res|_res)\s*[,:\)])/);
    const middlewareChunk = handlerStart !== -1 ? afterMatch.slice(0, handlerStart) : afterMatch.split('\n')[0];

    // Extract requirePermission
    const permMatch = middlewareChunk.match(/requirePermission\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
    const anyPermMatch = middlewareChunk.match(/requireAnyPermission\(([\s\S]*?)\)/);
    const hasRequireAuth = middlewareChunk.includes('requireAuth');
    const hasRequirePortalAuth = middlewareChunk.includes('requirePortalAuth') || content.slice(0, 1500).includes('router.use(requirePortalAuth)');

    let permissionGuard = 'None';
    if (permMatch) {
      permissionGuard = `requirePermission("${permMatch[1]}", "${permMatch[2]}")`;
    } else if (anyPermMatch) {
      const pairs = [...anyPermMatch[1].matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g)];
      permissionGuard = `requireAnyPermission(${pairs.map(p => `${p[1]}.${p[2]}`).join(', ')})`;
    } else if (middlewareChunk.includes('requireUserUpdatePermission')) {
      permissionGuard = 'requireUserUpdatePermission (dynamic: users.manage_permissions / reset_password / edit)';
    } else if (file === 'rooms.ts' && fullPath.includes('/status')) {
      permissionGuard = 'inline: accommodation.edit OR housing.edit OR housekeeping.edit';
    } else if (hasRequirePortalAuth) {
      permissionGuard = 'requirePortalAuth';
    } else if (hasRequireAuth) {
      permissionGuard = 'requireAuth';
    } else if (file === 'hr-sync.ts' && (rawPath === '/receive' || rawPath.startsWith('/profiles') || rawPath === '/notify-departure')) {
      permissionGuard = 'x-api-key (HR_SYNC_API_KEY)';
    } else if (file === 'user-signature.ts') {
      permissionGuard = 'router.use session check + self / isSystemAdmin';
    } else if (file === 'jobs.ts') {
      permissionGuard = 'router.use(requireAuth)';
    }

    // Tenant isolation check
    const endpointSnippet = content.slice(matchIndex, matchIndex + 2500);
    let isolation = 'Public / Global';
    if (endpointSnippet.includes('withTenant(')) {
      isolation = 'withTenant(propertyId) -> Schema isolated';
    } else if (endpointSnippet.includes('portalSession(req)')) {
      isolation = 'withTenant(sess.propertyId) -> Schema isolated';
    } else if (file === 'properties.ts') {
      isolation = 'public.properties (Filtered by authUser.propertyIds)';
    } else if (file === 'users.ts') {
      isolation = 'public.users (Filtered by sessionPropertyId / propertyIds)';
    } else if (file === 'activity_logs.ts') {
      isolation = endpointSnippet.includes('withTenant(') ? 'withTenant(propertyId) -> Schema isolated' : 'public / schema';
    }

    allRoutes.push({
      file,
      method,
      endpoint: '/api' + fullPath,
      permissionGuard,
      tenantIsolation: isolation
    });
  }
}

console.log('Total routes mapped with full paths:', allRoutes.length);
fs.writeFileSync(path.join(__dirname, 'all_routes_mapped.json'), JSON.stringify(allRoutes, null, 2));
