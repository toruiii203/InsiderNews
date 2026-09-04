const fs = require('fs');
const file = 'C:/Users/Migs/Desktop/InsiderNews/components/admin/articles-tab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Pass adminSecret to MediaUploadField
content = content.replace(/function MediaUploadField\(\{ value, onChange, label \}: \{/, 'function MediaUploadField({ value, onChange, label, adminSecret }: {\n  adminSecret: string\n');
// Update ArticleForm to receive and pass it
content = content.replace(/function ArticleForm\(\{ article, onClose, onSave \}: \{/, 'function ArticleForm({ article, onClose, onSave, adminSecret }: {\n  adminSecret: string\n');
content = content.replace(/<MediaUploadField value=\{formData.image_url\} onChange=\{\(url\)/, '<MediaUploadField adminSecret={adminSecret} value={formData.image_url} onChange={(url)');
// Pass it from ArticlesTab
content = content.replace(/<ArticleForm\n\s*article=\{editingArticle\}/, '<ArticleForm adminSecret={adminSecret}\n          article={editingArticle}');
content = content.replace(/<ArticleForm\n\s*article=\{null\}/, '<ArticleForm adminSecret={adminSecret}\n          article={null}');

fs.writeFileSync(file, content);
