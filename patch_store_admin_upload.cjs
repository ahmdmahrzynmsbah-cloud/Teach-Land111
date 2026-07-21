const fs = require('fs');
let code = fs.readFileSync('src/components/AcademyStoreAdmin.tsx', 'utf8');

const regex = /if \(itemImageFile\) \{([\s\S]*?)uploadedImageUrl = await getDownloadURL\(storageRef\);\s*\}/g;

code = code.replace(regex, `if (itemImageFile) {
        toast.success("جاري رفع الصورة للمنصة...");
        uploadedImageUrl = await uploadFileToFirebase(itemImageFile, () => {});
      }`);

fs.writeFileSync('src/components/AcademyStoreAdmin.tsx', code);
