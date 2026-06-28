import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../components/common/FormField.jsx";
import { OrderSummary } from "../../components/common/OrderSummary.jsx";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { PaymentMethodSelector } from "../../components/common/PaymentMethodSelector.jsx";
import { EmptyState, ErrorState } from "../../components/common/StateViews.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { orderService } from "../../services/orderService.js";
import { voucherService } from "../../services/voucherService.js";
import { productFallbackImage } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/format.js";
import { validateCheckout } from "../../utils/validation.js";

const initialValues = {
  recipientName: "",
  recipientPhone: "",
  state: "",
  city: "",
  street: "",
  buildingNumber: "",
  voucherCode: "",
  giftMessage: "",
  paymentMethod: "",
};

function normalizeVoucherCode(value) {
  return String(value || "").trim().toUpperCase();
}

function mapApiFieldErrors(fields = {}) {
  return Object.entries(fields).reduce((mapped, [field, message]) => {
    const key = field.startsWith("shippingAddress.")
      ? field.replace("shippingAddress.", "")
      : field;
    mapped[key] = message;
    return mapped;
  }, {});
}

function toCreateOrderPayload(values, appliedVoucher) {
  return {
    recipientName: values.recipientName,
    recipientPhone: values.recipientPhone,
    shippingAddress: {
      state: values.state,
      city: values.city,
      street: values.street,
      buildingNumber: values.buildingNumber,
    },
    voucherCode: appliedVoucher?.code || null,
    giftMessage: values.giftMessage,
    paymentMethod: values.paymentMethod,
  };
}

export function CheckoutPage() {
  const { cart, loading, refreshCart } = useCart();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [voucherQuote, setVoucherQuote] = useState(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    refreshCart().catch((error) => setPageError(error.message || "Could not load checkout."));
  }, [refreshCart]);

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    if (field === "voucherCode") {
      setVoucherQuote((current) => {
        if (!current) return current;
        return normalizeVoucherCode(value) === current.voucher.code ? current : null;
      });
    }
  }

  async function applyVoucher() {
    const voucherCode = normalizeVoucherCode(values.voucherCode);
    if (!voucherCode) {
      setErrors((current) => ({ ...current, voucherCode: "Enter a voucher code." }));
      return;
    }

    setApplyingVoucher(true);
    setErrors((current) => ({ ...current, voucherCode: "" }));
    setPageError("");
    try {
      const quote = await voucherService.applyVoucher(voucherCode);
      setVoucherQuote(quote);
      setValues((current) => ({ ...current, voucherCode: quote.voucher.code }));
      addToast({ title: "Voucher applied.", message: `${quote.voucher.code} has been added.` });
    } catch (error) {
      setVoucherQuote(null);
      setErrors((current) => ({
        ...current,
        ...mapApiFieldErrors(error.fields),
        voucherCode: error.fields?.voucherCode || error.message || "Could not apply voucher.",
      }));
    } finally {
      setApplyingVoucher(false);
    }
  }

  function removeVoucher() {
    setVoucherQuote(null);
    setValues((current) => ({ ...current, voucherCode: "" }));
    setErrors((current) => ({ ...current, voucherCode: "" }));
  }

  async function placeOrder() {
    const nextErrors = validateCheckout(values);
    const typedVoucherCode = normalizeVoucherCode(values.voucherCode);
    if (typedVoucherCode && voucherQuote?.voucher?.code !== typedVoucherCode) {
      nextErrors.voucherCode = "Apply this voucher before placing the order.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    setPageError("");
    try {
      const order = await orderService.createOrder(
        toCreateOrderPayload(values, voucherQuote?.voucher)
      );
      await refreshCart();
      addToast({ title: "Order placed successfully." });
      navigate(`/payment/${order.id}`);
    } catch (error) {
      if (error.fields) {
        setErrors((current) => ({ ...current, ...mapApiFieldErrors(error.fields) }));
      }
      setPageError(error.message || "Could not place order.");
      addToast({ type: "error", title: "Checkout failed.", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (pageError && !cart.items.length) {
    return (
      <section className="container section">
        <ErrorState message={pageError} onRetry={refreshCart} />
      </section>
    );
  }

  const itemCount = cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const discountAmount = voucherQuote?.discountAmount || "0.00";
  const totalAmount = voucherQuote?.totalAmount || cart.total;

  return (
    <section className="container section stack-lg entry">
      <PageHeader
        eyebrow="Checkout"
        title="Complete checkout"
        description="Add delivery details, a gift message, and your preferred payment method."
      />

      {loading ? (
        <div className="checkout-layout" aria-busy="true">
          <div className="skeleton" style={{ minHeight: 360 }} />
          <div className="skeleton" style={{ minHeight: 220 }} />
        </div>
      ) : cart.items.length === 0 ? (
        <EmptyState
          title="Checkout needs cart items"
          description="Add at least one gift before placing an order."
          actionLabel="Browse products"
          actionTo="/products"
        />
      ) : (
        <div className="checkout-layout">
          <div className="stack-lg">
            {pageError ? <div className="alert alert-error">{pageError}</div> : null}
            <section className="line-list" aria-label="Checkout items">
              {cart.items.map((item) => (
                <article className="line-row" key={item.id}>
                  <img
                    src={item.product.imageUrl || productFallbackImage}
                    alt={`${item.product.name} product photo`}
                  />
                  <div className="stack">
                    <h2>{item.product.name}</h2>
                    <p className="muted">
                      {item.quantity} x {formatCurrency(item.product.unitPrice)}
                    </p>
                  </div>
                  <strong className="price">{formatCurrency(item.lineTotal)}</strong>
                </article>
              ))}
            </section>

            <div className="surface surface-padded stack-lg">
              <div className="stack">
                <h2>Delivery recipient</h2>
                <div className="form-grid-2">
                  <FormField
                    label="Recipient name"
                    value={values.recipientName}
                    onChange={(value) => updateField("recipientName", value)}
                    error={errors.recipientName}
                    required
                  />
                  <FormField
                    label="Recipient phone"
                    value={values.recipientPhone}
                    onChange={(value) => updateField("recipientPhone", value)}
                    error={errors.recipientPhone}
                    required
                  />
                </div>
              </div>

              <div className="stack">
                <h2>Delivery address</h2>
                <div className="form-grid-2">
                  <FormField
                    label="State"
                    value={values.state}
                    onChange={(value) => updateField("state", value)}
                    error={errors.state}
                    required
                  />
                  <FormField
                    label="City"
                    value={values.city}
                    onChange={(value) => updateField("city", value)}
                    error={errors.city}
                    required
                  />
                  <FormField
                    label="Street"
                    value={values.street}
                    onChange={(value) => updateField("street", value)}
                    error={errors.street}
                    required
                  />
                  <FormField
                    label="Building number"
                    value={values.buildingNumber}
                    onChange={(value) => updateField("buildingNumber", value)}
                    error={errors.buildingNumber}
                    required
                  />
                </div>
              </div>

              <FormField
                label="Gift message"
                as="textarea"
                value={values.giftMessage}
                onChange={(value) => updateField("giftMessage", value)}
                error={errors.giftMessage}
                helperText="Optional. Keep it short enough for a card."
              />
              <div className="field">
                <label htmlFor="voucherCode">Voucher code</label>
                <div className="search-control">
                  <input
                    id="voucherCode"
                    className="input"
                    value={values.voucherCode}
                    onChange={(event) => updateField("voucherCode", event.target.value)}
                    aria-invalid={errors.voucherCode ? "true" : "false"}
                    aria-describedby={errors.voucherCode ? "voucherCode-error" : undefined}
                    placeholder="GIFT10"
                  />
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={applyVoucher}
                    disabled={applyingVoucher || !values.voucherCode.trim()}
                    aria-busy={applyingVoucher ? "true" : "false"}
                  >
                    {applyingVoucher ? "Applying..." : "Apply"}
                  </button>
                  {voucherQuote ? (
                    <button className="btn btn-tertiary" type="button" onClick={removeVoucher}>
                      Remove
                    </button>
                  ) : null}
                </div>
                {voucherQuote ? (
                  <span className="field-helper">
                    {voucherQuote.voucher.code} saves {formatCurrency(voucherQuote.discountAmount)}.
                  </span>
                ) : null}
                {errors.voucherCode ? (
                  <span className="field-error" id="voucherCode-error" role="alert">
                    {errors.voucherCode}
                  </span>
                ) : null}
              </div>
              <PaymentMethodSelector
                value={values.paymentMethod}
                onChange={(value) => updateField("paymentMethod", value)}
                error={errors.paymentMethod}
              />
            </div>
          </div>
          <OrderSummary
            itemCount={itemCount}
            subtotal={cart.subtotal}
            discount={discountAmount}
            voucher={voucherQuote?.voucher}
            total={totalAmount}
            paymentMethod={values.paymentMethod}
            actionLabel="Place order"
            onAction={placeOrder}
            loading={submitting}
            note="We will confirm availability and total before you place the order."
          />
        </div>
      )}
    </section>
  );
}
