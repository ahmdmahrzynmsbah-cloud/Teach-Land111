const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Replace imports
code = code.replace("import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';", "import { ref, getDownloadURL } from 'firebase/storage';\nimport { uploadFileToFirebase } from '../lib/upload';");

// Replace uploadBytes
const targetUpload = `        toast.success("جاري رفع شعار المنصة...");
        const storageRef = ref(storage, \`settings/platform-logo-\${Date.now()}\`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);`;

const replacementUpload = `        toast.success("جاري رفع شعار المنصة...");
        // Use uploadFileToFirebase instead of Firebase Storage directly to avoid CORS/rules issues
        logoUrl = await uploadFileToFirebase(logoFile, () => {});`;

code = code.replace(targetUpload, replacementUpload);
fs.writeFileSync('src/components/AdminPanel.tsx', code);
