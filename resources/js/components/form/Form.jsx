import './Form.css';

const FormGroup = ({ children, className = '' }) => {
  return (
    <div className={`form-group ${className}`}>
      {children}
    </div>
  );
};

const FormRow = ({ children, columns = 2, className = '' }) => {
  return (
    <div className={`form-row form-row-${columns} ${className}`}>
      {children}
    </div>
  );
};

const FormActions = ({ children, align = 'right', className = '' }) => {
  return (
    <div className={`form-actions form-actions-${align} ${className}`}>
      {children}
    </div>
  );
};

const Form = ({ 
  children, 
  onSubmit, 
  glass = false,
  className = '' 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form 
      className={`form ${glass ? 'form-glass' : ''} ${className}`}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
};

Form.Group = FormGroup;
Form.Row = FormRow;
Form.Actions = FormActions;

export default Form;
