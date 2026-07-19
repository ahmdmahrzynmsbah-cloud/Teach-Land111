const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace("Info } from 'lucide-react';", "Info, Menu } from 'lucide-react';");

const stateInsertPoint = `  const [subscribingLeague, setSubscribingLeague] = useState(false);`;
const stateInsert = `  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);\n  const [subscribingLeague, setSubscribingLeague] = useState(false);`;

code = code.replace(stateInsertPoint, stateInsert);

fs.writeFileSync('src/components/Dashboard.tsx', code);
