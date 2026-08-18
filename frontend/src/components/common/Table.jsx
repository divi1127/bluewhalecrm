import React from "react";

// Generic table: columns = [{ key, label, render? }], rows = array of data objects
const Table = ({ columns, rows, emptyMessage = "No records found" }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="card py-12 text-center text-sm text-ocean-400">{emptyMessage}</div>
    );
  }
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ocean-100 bg-ocean-50/50 text-xs font-semibold uppercase tracking-wide text-ocean-500">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || i} className="border-b border-ocean-50 last:border-0 hover:bg-ocean-50/40">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-ocean-800">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
