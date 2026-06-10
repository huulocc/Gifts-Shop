import { forwardRef, useId } from "react";

export const FormField = forwardRef(function FormField({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  type = "text",
  as = "input",
  options = [],
  rows = 4,
  id,
  ...props
}, ref) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const describedBy = [error ? errorId : "", helperText ? helperId : ""]
    .filter(Boolean)
    .join(" ");

  const commonProps = {
    id: fieldId,
    value,
    onChange: (event) => onChange(event.target.value),
    required,
    "aria-required": required ? "true" : undefined,
    "aria-invalid": error ? "true" : "false",
    "aria-describedby": describedBy || undefined,
    ...props,
  };

  return (
    <div className="field">
      <label htmlFor={fieldId}>
        {label}
        {required ? " (required)" : ""}
      </label>
      {as === "textarea" ? (
        <textarea className="textarea" rows={rows} ref={ref} {...commonProps} />
      ) : as === "select" ? (
        <select className="select" ref={ref} {...commonProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input className="input" type={type} ref={ref} {...commonProps} />
      )}
      {helperText ? (
        <span className="field-helper" id={helperId}>
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span className="field-error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
});
