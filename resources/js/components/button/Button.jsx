import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  width,           // default auto
  tabletWidth,     // optional width at <=768px
  mobileWidth,     // optional width at <=480px
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left', // 'left' | 'right'
  onClick,
  type = 'button',
  className = ''
}) => {
  const resolvedIconPosition = iconPosition === 'right' ? 'right' : 'left';
  const buttonClass = `
    btn 
    btn-${variant} 
    btn-${size} 
    ${fullWidth ? 'btn-full-width' : ''} 
    ${loading ? 'btn-loading' : ''} 
    ${className}
  `.trim();

  const iconElement = icon && !loading && (
    <span className={`btn-icon btn-icon-${resolvedIconPosition}`}>{icon}</span>
  );

  const styleVars = {
    ...(width ? { '--btn-width': width } : {}),
    ...(tabletWidth ? { '--btn-tablet-width': tabletWidth } : {}),
    ...(mobileWidth ? { '--btn-mobile-width': mobileWidth } : {})
  };

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      style={styleVars}
    >
      {loading && <span className="btn-spinner"></span>}
      {resolvedIconPosition === 'left' && iconElement}
      <span className="btn-text">{children}</span>
      {resolvedIconPosition === 'right' && iconElement}
    </button>
  );
};

export default Button;
