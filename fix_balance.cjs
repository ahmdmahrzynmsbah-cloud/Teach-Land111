const fs = require('fs');

// 1. types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/walletBalance\?: number;/, 'balance?: number;');
fs.writeFileSync('src/types.ts', types);

// 2. ProfileSection.tsx
let profile = fs.readFileSync('src/components/ProfileSection.tsx', 'utf8');
profile = profile.replace(/userData\?\.walletBalance \|\| 0/g, 'userData?.balance || 0');
fs.writeFileSync('src/components/ProfileSection.tsx', profile);

// 3. AdminPanel.tsx
let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
admin = admin.replace(/editFormData\.walletBalance \!== undefined \? editFormData\.walletBalance/g, 'editFormData.balance !== undefined ? editFormData.balance');
admin = admin.replace(/walletBalance: e\.target\.value \? Number\(e\.target\.value\) : 0/g, 'balance: e.target.value ? Number(e.target.value) : 0');
fs.writeFileSync('src/components/AdminPanel.tsx', admin);

