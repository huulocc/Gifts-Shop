import { formatStatus, getStockState } from "../../utils/format.js";

function variantFor(type, value) {
  if (type === "stock") {
    if (value === "out_of_stock") return "danger";
    if (value === "low_stock") return "warning";
    return "success";
  }
  if (["paid", "completed", "completed_payment", "active"].includes(value)) return "success";
  if (["pending", "low_stock"].includes(value)) return "warning";
  if (["placed"].includes(value)) return "info";
  if (["cancelled", "failed", "inactive", "out_of_stock"].includes(value)) return "danger";
  return "neutral";
}

export function StatusBadge({ type = "order", value, label }) {
  const normalizedValue =
    type === "stock" && typeof value === "number" ? getStockState(value) : value;
  const variant = variantFor(type, normalizedValue);
  return (
    <span className={`badge badge-${variant}`}>
      {label || formatStatus(normalizedValue)}
    </span>
  );
}
