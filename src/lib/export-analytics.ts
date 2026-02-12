/**
 * Export Analytics as CSV or JSON with formatted headers
 */

export const exportAnalyticsAsCSV = (
  data: any[],
  filename: string,
  columns?: { key: string; label: string }[]
) => {
  if (data.length === 0) return;

  const headers = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const csv = [
    headers.map(h => `"${h.label}"`).join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h.key];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return typeof val === 'number' ? val : `"${val}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportAnalyticsAsJSON = (
  data: any[],
  filename: string,
  metadata?: Record<string, any>
) => {
  const exportData = {
    export_date: new Date().toISOString(),
    total_records: data.length,
    ...metadata,
    data,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
