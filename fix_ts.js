const fs = require('fs');

// Fix theme-switcher.tsx
let theme = fs.readFileSync('C:/Users/Migs/Desktop/InsiderNews/components/theme-switcher.tsx', 'utf8');
theme = theme.replace(/onClick=\{\(\) => setTheme\(t\.id\)\}\n\s*suppressHydrationWarning/g, 'onClick={() => setTheme(t.id)}');
fs.writeFileSync('C:/Users/Migs/Desktop/InsiderNews/components/theme-switcher.tsx', theme);

// Fix app/search/page.tsx
let search = fs.readFileSync('C:/Users/Migs/Desktop/InsiderNews/app/search/page.tsx', 'utf8');
search = search.replace(/article=\{article\}/g, 'article={article as any}');
fs.writeFileSync('C:/Users/Migs/Desktop/InsiderNews/app/search/page.tsx', search);

// Fix about-tab.tsx
let about = fs.readFileSync('C:/Users/Migs/Desktop/InsiderNews/components/admin/about-tab.tsx', 'utf8');
about = about.replace(/<StaffForm\n\s*member=\{null\}/g, '<StaffForm adminSecret={adminSecret}\n          member={null}');
fs.writeFileSync('C:/Users/Migs/Desktop/InsiderNews/components/admin/about-tab.tsx', about);

// Fix articles-tab.tsx
let articles = fs.readFileSync('C:/Users/Migs/Desktop/InsiderNews/components/admin/articles-tab.tsx', 'utf8');
articles = articles.replace(/<ArticleForm\n\s*article=\{null\}/g, '<ArticleForm adminSecret={adminSecret}\n          article={null}');
articles = articles.replace(/<MediaUploadField label="Featured Image" value=\{formData\.image_url\} onChange=\{\(url\)/g, '<MediaUploadField adminSecret={adminSecret} label="Featured Image" value={formData.image_url} onChange={(url)');
fs.writeFileSync('C:/Users/Migs/Desktop/InsiderNews/components/admin/articles-tab.tsx', articles);

// Fix videos-tab.tsx
let videos = fs.readFileSync('C:/Users/Migs/Desktop/InsiderNews/components/admin/videos-tab.tsx', 'utf8');
videos = videos.replace(/<VideoForm\n\s*video=\{null\}/g, '<VideoForm adminSecret={adminSecret}\n          video={null}');
videos = videos.replace(/<MediaUploadField label="Video URL" value=\{formData\.video_url\} onChange=\{\(url\)/g, '<MediaUploadField adminSecret={adminSecret} label="Video URL" value={formData.video_url} onChange={(url)');
videos = videos.replace(/<MediaUploadField label="Custom Thumbnail" kind="image" value=\{formData\.thumbnail_url\} onChange=\{\(url\)/g, '<MediaUploadField adminSecret={adminSecret} label="Custom Thumbnail" kind="image" value={formData.thumbnail_url} onChange={(url)');
fs.writeFileSync('C:/Users/Migs/Desktop/InsiderNews/components/admin/videos-tab.tsx', videos);

