const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  "{ id: 'student_store', label: 'المتجر والمشتريات', icon: Edit3 },",
  "{ id: 'student_store', label: 'المتجر', icon: ShoppingBag },\n        { id: 'purchases', label: 'مشترياتي', icon: FileText },"
);

code = code.replace(
  "{ id: 'student_store', label: 'المتجر', icon: Edit3 },",
  "{ id: 'student_store', label: 'المتجر', icon: ShoppingBag },\n        { id: 'purchases', label: 'مشترياتي', icon: FileText },"
);

code = code.replace(
  "import { \n  Target,",
  "import { \n  Target,\n  ShoppingBag,"
);
// just in case ShoppingBag is not imported, we will add it to lucide-react imports if it's missing.

fs.writeFileSync('src/components/Dashboard.tsx', code);
