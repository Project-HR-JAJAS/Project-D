import React from 'react';
import * as XLSX from 'xlsx';
import { CSVLink } from 'react-csv';

interface TableExportButtonProps {
  data: object[];
  columns: { label: string; key: string }[];
  filename: string;
  format: 'csv' | 'xlsx';
}

const TableExportButton: React.FC<TableExportButtonProps> = ({ data, columns, filename, format }) => {
  const handleExportXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: columns.map(col => col.key),
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Set column headers
    XLSX.utils.sheet_add_aoa(worksheet, [columns.map(col => col.label)], { origin: 'A1' });

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return format === 'csv' ? (
    <CSVLink
      data={data}
      headers={columns}
      filename={`${filename}.csv`}
      className="download-button"
    >
      Export as CSV
    </CSVLink>
  ) : (
    <button className="download-button" onClick={handleExportXLSX}>
      Export as XLSX
    </button>
  );
};

export default TableExportButton;
