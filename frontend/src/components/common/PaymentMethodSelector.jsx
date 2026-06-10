import { paymentMethods } from "../../utils/constants.js";
import { formatStatus } from "../../utils/format.js";

const descriptions = {
  cash: "Record a cash transaction for this order.",
  credit_card: "Record credit card as the selected method only.",
  paypal: "Record PayPal as the selected method only.",
  bank_transfer: "Record a bank transfer transaction.",
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
