import './Tabs.css';

const Tabs = ({ tabs = [], activeKey, onChange, className = '' }) => {
  return (
    <div className={`tabs ${className}`.trim()}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-button ${activeKey === tab.key ? 'active' : ''}`}
          onClick={() => onChange?.(tab.key)}
          type="button"
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
