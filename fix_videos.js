const fs = require('fs');
const file = 'C:/Users/Migs/Desktop/InsiderNews/components/admin/videos-tab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/function MediaUploadField\(\{ value, onChange, label, kind = "video" \}: \{/, 'function MediaUploadField({ value, onChange, label, kind = "video", adminSecret }: {\n  adminSecret: string\n');
content = content.replace(/function VideoForm\(\{ video, onClose, onSave \}: \{/, 'function VideoForm({ video, onClose, onSave, adminSecret }: {\n  adminSecret: string\n');
content = content.replace(/<MediaUploadField value=\{formData.video_url\} onChange=\{\(url\)/, '<MediaUploadField adminSecret={adminSecret} value={formData.video_url} onChange={(url)');
content = content.replace(/<MediaUploadField value=\{formData.thumbnail_url\} onChange=\{\(url\)/, '<MediaUploadField adminSecret={adminSecret} value={formData.thumbnail_url} onChange={(url)');

content = content.replace(/<VideoForm\n\s*video=\{editingVideo\}/, '<VideoForm adminSecret={adminSecret}\n          video={editingVideo}');
content = content.replace(/<VideoForm\n\s*video=\{null\}/, '<VideoForm adminSecret={adminSecret}\n          video={null}');

fs.writeFileSync(file, content);
