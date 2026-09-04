const fs = require('fs');

const fixTab = (file, name) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/export function \(\{ adminSecret/g, 'export function ' + name + '({ adminSecret');
  fs.writeFileSync(file, content);
};
fixTab('C:/Users/Migs/Desktop/InsiderNews/components/admin/articles-tab.tsx', 'ArticlesTab');
fixTab('C:/Users/Migs/Desktop/InsiderNews/components/admin/videos-tab.tsx', 'VideosTab');
fixTab('C:/Users/Migs/Desktop/InsiderNews/components/admin/subscribers-tab.tsx', 'SubscribersTab');
fixTab('C:/Users/Migs/Desktop/InsiderNews/components/admin/about-tab.tsx', 'AboutTab');

// Now fix header
const headerFile = 'C:/Users/Migs/Desktop/InsiderNews/components/header.tsx';
let header = fs.readFileSync(headerFile, 'utf8');
header = header.replace(/\\n/g, '\n');
header = header.replace(/\?\?/g, '??'); // just fallback to sun
fs.writeFileSync(headerFile, header);
