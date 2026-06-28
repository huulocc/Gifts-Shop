import { paymentMethods } from "../../utils/constants.js";
import { formatStatus } from "../../utils/format.js";

const descriptions = {
  cash: "Pay with cash when your order is delivered.",
  credit_card: "Use your card for this order.",
  paypal: "Use PayPal for this order.",
  bank_transfer: "Pay by bank transfer after checkout.",
};

export function PaymentMethodSelector({ value, onChange, error }) {
  return (
    <fieldset className="field">
      <legend className="radio-group-label">Payment method (required)</legend>
      <div className="radio-grid">
        {paymentMethods.map((method) => (
          <label className="radio-card" key={method}>
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={value === method}
              onChange={(event) => onChange(event.target.value)}
            />
            <span>
              <strong>{formatStatus(method)}</strong>
              <br />
              <span className="muted">{descriptions[method]}</span>
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
