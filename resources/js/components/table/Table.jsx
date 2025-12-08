import './Table.css';

const Table = ({ columns = [], children, className = '' }) => {
  return (
    <div className={`table ${className}`.trim()}>
      <div className="table-head">
        {columns.map((col) => (
          <div key={col.key || col.label || col} className="table-cell table-head-cell">
            {col.label || col}
          </div>
        ))}
      </div>
      <div className="table-body">{children}</div>
    </div>
  );
};

export default Table;
