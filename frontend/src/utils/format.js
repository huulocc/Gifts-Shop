import { statusLabels } from "./constants.js";

export function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatStatus(value) {
  return statusLabels[value] || String(value || "").replaceAll("_", " ");
}

export function getStockState(quantity) {
  if (Number(quantity) <= 0) return "out_of_stock";
  if (Number(quantity) <= 5) return "low_stock";
  return "in_stock";
}

export function calculateCartTotal(items) {
  return items.reduce((sum, item) => {
    return sum + Number(item.product?.unitPrice || 0) * Number(item.quantity || 0);
  }, 0);
}

export function calculateLineTotal(item) {
  return Number(item.product?.unitPrice || item.unitPrice || 0) * Number(item.quantity || 0);
}

export function makeOrderIdLabel(id) {
  if (!id) return "Order";
  return `Order ${id.slice(0, 10)}`;
}

export function formatAddress(address) {
  if (!address) return "No delivery address provided.";
  return [
    address.buildingNumber,
    address.street,
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(", ") || "No delivery address provided.";
}
