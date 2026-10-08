const fs = require('fs');
const path = require('path');

function replaceFindFirst(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceFindFirst(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('prisma.business.findFirst()')) {
        let needsNextHeaders = false;
        
        const newContent = content.replace(/const\s+(\w+)\s*=\s*await\s+prisma\.business\.findFirst\(\);?/g, (match, varName) => {
          needsNextHeaders = true;
          return `const cookieStore = await cookies();\n    const businessId = cookieStore.get('businessId')?.value;\n    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n    const ${varName} = await prisma.business.findUnique({ where: { id: businessId } });`;
        });
        
        let finalContent = newContent;
        if (needsNextHeaders && !finalContent.includes("from 'next/headers'")) {
          // Find the first line that is not a comment or empty to insert imports if needed
          finalContent = `import { cookies } from 'next/headers';\n${finalContent}`;
        }
        fs.writeFileSync(fullPath, finalContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceFindFirst(path.join(__dirname, 'src/app/api/os'));
console.log('Done replacing findFirst');
