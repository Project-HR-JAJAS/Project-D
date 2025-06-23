import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableExportButton from './TableExportButton';
import * as XLSX from 'xlsx';

// XLSX faken voorkomt echte download
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
    sheet_add_aoa: jest.fn(),
  },
  writeFile: jest.fn(),
}));

const data = [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
];

const columns = [
  { label: 'ID',   key: 'id'   },
  { label: 'Name', key: 'name' },
];

test('toont CSV-link', () => {
  render(
    <TableExportButton
      data={data}
      columns={columns}
      filename="test"
      format="csv"
    />
  );

  const link = screen.getByRole('link', { name: /export as csv/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('download', 'test.csv');
});

test('toont XLSX-knop & roept writeFile aan', () => {
  render(
    <TableExportButton
      data={data}
      columns={columns}
      filename="test"
      format="xlsx"
    />
  );

  const btn = screen.getByRole('button', { name: /export as xlsx/i });
  fireEvent.click(btn);

  expect(XLSX.writeFile).toHaveBeenCalled();
});
