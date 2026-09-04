const fs = require('fs');
const files = [
  'C:/Users/Migs/Desktop/InsiderNews/components/admin/articles-tab.tsx',
  'C:/Users/Migs/Desktop/InsiderNews/components/admin/videos-tab.tsx',
  'C:/Users/Migs/Desktop/InsiderNews/components/admin/subscribers-tab.tsx',
  'C:/Users/Migs/Desktop/InsiderNews/components/admin/about-tab.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const ADMIN_SECRET = process\.env\.NEXT_PUBLIC_ADMIN_SECRET \?\? ".*"/, '');
  
  // Replace the component export to add adminSecret prop
  content = content.replace(/export function (\w+Tab)\(\) {/, 'export function ({ adminSecret }: { adminSecret: string }) {');
  
  // Replace ADMIN_SECRET inside the body with adminSecret
  content = content.replace(/ADMIN_SECRET/g, 'adminSecret');
  
  fs.writeFileSync(file, content);
}
