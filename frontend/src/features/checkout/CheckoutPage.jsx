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
import { productFallbackImage } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/format.js";
import { validateCheckout } from "../../utils/validation.js";

export function CheckoutPage() {
  const { cart, loading, refreshCart, setCart } = useCart();
  const [values, setValues] = useState({ giftMessage: "", paymentMethod: "" });
  const [errors, setErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    refreshCart().catch((error) => setPageError(error.message || "Could not load checkout."));
  }, [refreshCart]);

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function placeOrder() {
    const nextErrors = validateCheckout(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    setPageError("");
    try {
      const order = await orderService.createOrder(values);
      await refreshCart().then(setCart);
      addToast({ title: "Order placed successfully." });
      navigate(`/payment/${order.id}`);
    } catch (error) {
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

  return (
    <section className="container section stack-lg entry">
      <PageHeader
        eyebrow="Checkout"
        title="Create an order"
        description="Payment is stored as a recorded transaction. No external payment gateway is used."
      />

      {loading ? (
        <div className="checkout-layout" aria-busy="true">
          <div className="skeleton" style={{ minHeight: 360 }} />
          <div className="skeleton" style={{ minHeight: 220 }} />
        </div>
      ) : cart.items.length === 0 ? (
        <EmptyState
          title="Checkout needs cart items"
          description="Add at least one active product before placing an order."
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
              <FormField
                label="Gift message"
                as="textarea"
                value={values.giftMessage}
                onChange={(value) => updateField("giftMessage", value)}
                error={errors.giftMessage}
                helperText="Optional. Keep it short enough for a card."
              />
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
            total={cart.total}
            paymentMethod={values.paymentMethod}
            actionLabel="Place order"
            onAction={placeOrder}
            loading={submitting}
            note="Stock and totals are verified by the API before the order is created."
          />
        </div>
      )}
    </section>
  );
}
