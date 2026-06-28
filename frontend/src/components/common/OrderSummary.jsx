import { formatCurrency, formatStatus } from "../../utils/format.js";
import { Button } from "./Button.jsx";

export function OrderSummary({
  title = "Order summary",
  itemCount,
  subtotal,
  discount,
  voucher,
  total,
  paymentMethod,
  actionLabel,
  actionTo,
  onAction,
  disabled,
  loading,
  note,
}) {
  return (
    <aside className="summary-card" aria-label={title}>
      <h2>{title}</h2>
      <div className="summary-line">
        <span>Items</span>
        <strong className="mono">{itemCount}</strong>
      </div>
      <div className="summary-line">
        <span>Subtotal</span>
        <strong className="mono">{formatCurrency(subtotal)}</strong>
      </div>
      {Number(discount || 0) > 0 ? (
        <div className="summary-line">
          <span>{voucher?.code ? `Voucher ${voucher.code}` : "Discount"}</span>
          <strong className="mono">-{formatCurrency(discount)}</strong>
        </div>
      ) : null}
      {paymentMethod ? (
        <div className="summary-line">
          <span>Payment method</span>
          <strong>{formatStatus(paymentMethod)}</strong>
        </div>
      ) : null}
      <div className="summary-line summary-total">
        <span>Total</span>
        <strong className="mono">{formatCurrency(total)}</strong>
      </div>
      {note ? <p className="muted">{note}</p> : null}
      {actionLabel && actionTo ? (
        <Button to={actionTo} disabled={disabled} full>
          {actionLabel}
        </Button>
      ) : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} disabled={disabled} loading={loading} full>
          {actionLabel}
        </Button>
      ) : null}
    </aside>
  );
}
