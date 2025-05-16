export interface ImportLogEntry {
  date: string;
  filename: string;
  status: 'Success' | 'Fail';
  records: number;
}

export async function fetchImportLogs(): Promise<ImportLogEntry[]> {
  const response = await fetch('http://localhost:8000/import-log');

  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
