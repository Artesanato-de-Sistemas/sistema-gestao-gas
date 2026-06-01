const fs = require('fs');

const files = [
  'src/pages/Login.tsx',
  'src/pages/Sales.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/DriversDashboard.tsx',
  'src/pages/Inbounds.tsx',
  'src/pages/Stock.tsx',
  'src/pages/Customers.tsx',
  'src/pages/Employees.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace Card's bodyStyle
  // bodyStyle={{ padding: 0 }}
  // => styles={{ body: { padding: 0 } }}
  newContent = newContent.replace(/bodyStyle=\{\{([^\}]+)\}\}/g, "styles={{ body: {$1} }}");

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
});
