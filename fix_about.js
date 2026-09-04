const fs = require('fs');
const file = 'C:/Users/Migs/Desktop/InsiderNews/components/admin/about-tab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/function AboutContentEditor\(\) \{/, 'function AboutContentEditor({ adminSecret }: { adminSecret: string }) {');
content = content.replace(/function StaffManager\(\) \{/, 'function StaffManager({ adminSecret }: { adminSecret: string }) {');
content = content.replace(/function StaffForm\(\{ member, onClose, onSaved \}: \{/, 'function StaffForm({ member, onClose, onSaved, adminSecret }: {\n  adminSecret: string\n');

content = content.replace(/<AboutContentEditor \/>/, '<AboutContentEditor adminSecret={adminSecret} />');
content = content.replace(/<StaffManager \/>/, '<StaffManager adminSecret={adminSecret} />');
content = content.replace(/<StaffForm\n\s*member=\{null\}/g, '<StaffForm adminSecret={adminSecret}\n          member={null}');
content = content.replace(/<StaffForm\n\s*member=\{editingMember\}/g, '<StaffForm adminSecret={adminSecret}\n          member={editingMember}');
content = content.replace(/<MediaUploadField value=\{formData.image_url\} onChange=\{\(url\)/g, '<MediaUploadField adminSecret={adminSecret} value={formData.image_url} onChange={(url)');

content = content.replace(/function MediaUploadField\(\{ value, onChange, label \}: \{/, 'function MediaUploadField({ value, onChange, label, adminSecret }: {\n  adminSecret: string\n');

fs.writeFileSync(file, content);
