import { EmptyState } from "./StateViews.jsx";

export function DataTable({ caption, columns, rows, rowKey, loading = false, emptyState }) {
  if (loading) {
    return (
      <div className="table-wrap" aria-busy="true">
        <div className="skeleton-table-row skeleton" />
        <div className="skeleton-table-row skeleton" />
        <div className="skeleton-table-row skeleton" />
        <div className="skeleton-table-row skeleton" />
      </div>
    );
  }

  if (!rows.length) {
    return emptyState || <EmptyState title="Nothing to show" description="There is nothing here yet." />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
