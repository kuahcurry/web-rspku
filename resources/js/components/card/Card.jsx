import './Card.css';

const Card = ({ 
  children, 
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'default', // default, primary, success, danger, warning, info
  padding = 'normal', // compact, normal, spacious
  border = false,
  shadow = true,
  glass = false,
  hover = false,
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`
        card 
        card-${variant} 
        card-${padding} 
        ${glass ? 'card-glass' : ''} 
        ${hover ? 'card-hover' : ''} 
        ${border ? 'card-border' : ''}
        ${shadow ? '' : 'card-no-shadow'}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
    >
      {(title || subtitle || headerAction) && (
        <div className="card-header">
          <div className="card-header-text">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && (
            <div className="card-header-action">{headerAction}</div>
          )}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
