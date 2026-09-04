const fs = require('fs');
const file = 'C:/Users/Migs/Desktop/InsiderNews/components/theme-switcher.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<button suppressHydrationWarning\n\s*key=\{t\.id\}\n\s*onClick=\{\(\) => setTheme\(t\.id\)\}\n\s*suppressHydrationWarning/, '<button suppressHydrationWarning\n              key={t.id}\n              onClick={() => setTheme(t.id)}');
fs.writeFileSync(file, content);
