export function processCSV(csvText: string): Array<{ name: string; phone: string; email?: string }> {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const nameIndex = headers.findIndex(h => h.includes('name'));
  const phoneIndex = headers.findIndex(h => h.includes('phone'));
  const emailIndex = headers.findIndex(h => h.includes('email'));
  
  if (nameIndex === -1 || phoneIndex === -1) {
    throw new Error('CSV must contain name and phone columns');
  }
  
  const contacts = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length >= 2) {
      const contact: { name: string; phone: string; email?: string } = {
        name: values[nameIndex],
        phone: values[phoneIndex],
      };
      
      if (emailIndex !== -1 && values[emailIndex]) {
        contact.email = values[emailIndex];
      }
      
      contacts.push(contact);
    }
  }
  
  return contacts;
}

export function generateCSVTemplate(): string {
  return 'name,phone,email\nJohn Doe,+31612345678,john@example.com\nJane Smith,+31687654321,jane@example.com';
}

export function exportToCSV(data: any[], filename: string): void {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
