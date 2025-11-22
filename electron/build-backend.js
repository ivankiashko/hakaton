const fs = require('fs-extra');
const path = require('path');

console.log('Preparing backend for packaging...');

const backendSrc = path.join(__dirname, '..', 'backend');
const backendDest = path.join(__dirname, '..', 'backend');

// Проверяем, что backend существует
if (!fs.existsSync(backendSrc)) {
  console.error('Backend directory not found!');
  process.exit(1);
}

// Создаем requirements.txt если его нет
const requirementsPath = path.join(backendSrc, 'requirements.txt');
if (!fs.existsSync(requirementsPath)) {
  console.log('Creating requirements.txt...');
  const requirements = `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
`;
  fs.writeFileSync(requirementsPath, requirements);
}

console.log('Backend preparation complete!');
console.log('Backend files will be included in the build.');
