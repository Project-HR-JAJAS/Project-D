import React from 'react';
import * as XLSX from 'xlsx';
import { CSVLink } from 'react-csv';

interface TableExportButtonProps {
  data: object[];
  columns: { label: string; key: string }[];
  filename: string;
  format: 'csv' | 'xlsx';
  dateKey?: string;      // key like "Start_datetime"
  fromDate?: string;     // e.g. "2024-05-20"
  toDate?: string;       //e.g. "2024-06-20"
}

const TableExportButton: React.FC<TableExportButtonProps> = ({
  data,
  columns,
  filename,
  format,
  dateKey,
  fromDate,
  toDate,
}) => {
  const getFilteredData = () => {
    if (!dateKey || !fromDate || !toDate) return data;

    const from = new Date(fromDate);
    const to = new Date(toDate);

    return data.filter((item: any) => {
      const value = item[dateKey];
      if (!value) return false;
      const date = new Date(value);
      return date >= from && date <= to;
    });
  };

  const handleExportXLSX = () => {
    const filteredData = getFilteredData();
    const worksheet = XLSX.utils.json_to_sheet(filteredData, {
      header: columns.map(col => col.key),
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Set column headers
    XLSX.utils.sheet_add_aoa(worksheet, [columns.map(col => col.label)], { origin: 'A1' });

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const filteredData = getFilteredData();

  return format === 'csv' ? (
    <CSVLink
      data={filteredData}
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
