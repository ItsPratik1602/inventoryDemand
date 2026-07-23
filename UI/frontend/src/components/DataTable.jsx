function DataTable({ columns, rows = [], emptyMessage = "No records found." }) {
    
  // Ensure data is always an array
  const safeData = Array.isArray(rows) ? rows : [];
  
  // Safe check for data
  if (!safeData || safeData.length === 0) {
    return (
      <div className="table-shell">
        <div className="table-container w-full">
          <table className="w-full text-left" style={{ 
            tableLayout: 'auto',
            borderCollapse: 'collapse'
          }}>
            <thead className="bg-white/80">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)] backdrop-blur"
                    style={{
                      textAlign: 'left',
                      verticalAlign: 'middle',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="table-shell">
      <div className="table-container w-full">
        <table className="w-full text-left" style={{ 
          tableLayout: 'auto',
          borderCollapse: 'collapse'
        }}>
          <thead className="bg-white/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)] backdrop-blur"
                  style={{
                    textAlign: 'left',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeData.map((row, rowIndex) => {
              // Skip invalid rows
              if (!row || typeof row !== 'object') {
                return null;
              }
              
              return (
                <tr key={rowIndex} className="border-b border-gray-100">
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className="px-4 py-3 text-sm align-middle"
                      style={{
                        textAlign: 'left',
                        verticalAlign: 'middle',
                        whiteSpace: column.key === 'actions' ? 'nowrap' : 'normal'
                      }}
                    >
                      {column.render ? (
                        (() => {
                          try {
                            return column.render(row);
                          } catch (error) {
                            console.error('DataTable render error:', error, { row, column });
                            return <span className="text-gray-400">-</span>;
                          }
                        })()
                      ) : (
                        <div className={column.key === 'name' ? 'max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap' : ''}>
                          {row[column.key] ?? '-'}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
