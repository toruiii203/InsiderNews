const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('/tinph-logo.png')) {
        content = content.replace(/\/tinph-logo\.png/g, '/tinph-logo-v2.png');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}
replaceInDir('C:/Users/Migs/Desktop/InsiderNews/app');
replaceInDir('C:/Users/Migs/Desktop/InsiderNews/components');
