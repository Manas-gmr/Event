/**
 * Utility to export data as CSV
 */

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.map(h => `"${h}"`).join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        let value = row[header];
        // Handle null, undefined, objects
        if (value === null || value === undefined) return '""';
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',')
    )
  ].join('\r\n');

  // Include Unicode BOM so Excel recognizes UTF-8 correctly
  const csvWithBom = '\uFEFF' + csvContent;

  // Create and download blob
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
