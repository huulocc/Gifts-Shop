import { Link } from "react-router-dom";

export function Button({
  children,
  variant = "primary",
  size = "normal",
  loading = false,
  loadingLabel = "Working",
  full = false,
  className = "",
  to,
  type = "button",
  disabled,
  ...props
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "small" ? "btn-small" : "",
    full ? "btn-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : "false"}
      {...props}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
