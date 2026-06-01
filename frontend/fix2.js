import fs from 'fs';

const replaces = {
  'styles={{ body: {} }}': 'styles={{ body: { padding: 0 } }}',
};

// We will use standard string replaces since they are predictable
function process(f, isPadding0) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Some are padding: 0, some are 16px, some are 24px, Inbounds is complex.
    // Let's just replace all empty with padding: 0 initially.
    
    // Let's just do it explicitly per file:
    
    if (f.includes('Login.tsx')) content = content.replace("styles={{ body: {} }}", "styles={{ body: { padding: 0 } }}");
    if (f.includes('Sales.tsx')) {
        content = content.replace("styles={{ body: {} }}", "styles={{ body: { padding: '16px' } }}").replace("styles={{ body: {} }}", "styles={{ body: { padding: 0 } }}");
    }
    if (f.includes('Dashboard.tsx')) {
        content = content.replaceAll("styles={{ body: {} }}", "styles={{ body: { padding: '24px' } }}");
    }
    if (f.includes('DriversDashboard.tsx')) {
        let i = 0;
        content = content.replaceAll("styles={{ body: {} }}", () => {
            i++;
            if (i <= 4) return "styles={{ body: { padding: '24px' } }}";
            return "styles={{ body: { padding: 0 } }}";
        });
    }
    if (f.includes('Inbounds.tsx')) {
        content = content.replace("styles={{ body: {} }}", "styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, padding: 0 } }}");
    }
    if (f.includes('Stock.tsx')) {
        content = content.replace("styles={{ body: {} }}", "styles={{ body: { padding: '16px' } }}").replace("styles={{ body: {} }}", "styles={{ body: { padding: 0 } }}").replace("styles={{ body: {} }}", "styles={{ body: { padding: 0 } }}");
    }
    if (f.includes('Customers.tsx')) {
        content = content.replace("styles={{ body: {} }}", "styles={{ body: { padding: '16px' } }}").replace("styles={{ body: {} }}", "styles={{ body: { padding: 0 } }}");
    }
    if (f.includes('Employees.tsx')) {
        content = content.replace("styles={{ body: {} }}", "styles={{ body: { padding: '16px' } }}").replace("styles={{ body: {} }}", "styles={{ body: { padding: 0 } }}");
    }

    fs.writeFileSync(f, content);
}

const files = ['src/pages/Login.tsx', 'src/pages/Sales.tsx', 'src/pages/Dashboard.tsx', 'src/pages/DriversDashboard.tsx', 'src/pages/Inbounds.tsx', 'src/pages/Stock.tsx', 'src/pages/Customers.tsx', 'src/pages/Employees.tsx'];

files.forEach(f => process(f));
