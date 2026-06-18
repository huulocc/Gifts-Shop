import { useEffect, useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { OrderSummary } from "../../components/common/OrderSummary.jsx";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { QuantityStepper } from "../../components/common/QuantityStepper.jsx";
import { EmptyState, ErrorState } from "../../components/common/StateViews.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { productFallbackImage } from "../../utils/constants.js";
import { formatCurrency, getStockState } from "../../utils/format.js";
import { validateQuantity } from "../../utils/validation.js";

export function CartPage() {
  const { cart, loading, refreshCart, updateItem, removeItem, clearCart } = useCart();
  const { addToast } = useToast();
  const [itemErrors, setItemErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [busyItemId, setBusyItemId] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    refreshCart().catch((error) => setPageError(error.message || "Could not load cart."));
  }, [refreshCart]);

  async function handleQuantity(item, quantity) {
    const message = validateQuantity(Number(quantity), item.product.quantity);
    setItemErrors((current) => ({ ...current, [item.id]: message }));
    if (message) return;
    setBusyItemId(item.id);
    try {
      await updateItem(item.id, { quantity: Number(quantity) });
    } catch (error) {
      addToast({ type: "error", title: "Could not update cart.", message: error.message });
      setItemErrors((current) => ({ ...current, [item.id]: error.message }));
    } finally {
      setBusyItemId("");
    }
  }

  async function handleRemove(itemId) {
    setBusyItemId(itemId);
    try {
      await removeItem(itemId);
    } catch (error) {
      addToast({ type: "error", title: "Could not remove item.", message: error.message });
    } finally {
      setBusyItemId("");
    }
  }

  async function handleClearCart() {
    setClearing(true);
    try {
      await clearCart();
      setClearDialogOpen(false);
      addToast({ title: "Cart cleared." });
    } catch (error) {
      addToast({ type: "error", title: "Could not clear cart.", message: error.message });
    } finally {
      setClearing(false);
    }
  }

  if (pageError) {
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
        eyebrow="Cart"
        title="Review your gifts"
        description="Quantities are checked against current stock before checkout."
      />

      {loading ? (
        <div className="cart-layout" aria-busy="true">
          <div className="skeleton" style={{ minHeight: 320 }} />
          <div className="skeleton" style={{ minHeight: 220 }} />
        </div>
      ) : cart.items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse active products and add a gift before checkout."
          actionLabel="Browse products"
          actionTo="/products"
        />
      ) : (
        <>
          <div className="cluster" style={{ justifyContent: "flex-end" }}>
            <Button variant="danger" size="small" onClick={() => setClearDialogOpen(true)}>
              Clear cart
            </Button>
          </div>
          <div className="cart-layout">
            <div className="line-list">
            {cart.items.map((item) => {
              const stockState = getStockState(item.product.quantity);
              return (
                <article className="line-row" key={item.id}>
                  <img
                    src={item.product.imageUrl || productFallbackImage}
                    alt={`${item.product.name} product photo`}
                  />
                  <div className="stack">
                    <div>
                      <h2>{item.product.name}</h2>
                      <p className="muted">{item.product.category?.name}</p>
                    </div>
                    <p className="muted">
                      {formatCurrency(item.product.unitPrice)} each, {item.product.quantity} in stock.
                    </p>
                    {stockState === "out_of_stock" ? (
                      <p className="field-error" role="alert">
                        This item is out of stock. Remove it before checkout.
                      </p>
                    ) : null}
                    {itemErrors[item.id] ? (
                      <p className="field-error" role="alert">
                        {itemErrors[item.id]}
                      </p>
                    ) : null}
                  </div>
                  <div className="stack" style={{ justifyItems: "end" }}>
                    <QuantityStepper
                      value={item.quantity}
                      max={Math.max(1, item.product.quantity)}
                      onChange={(value) => handleQuantity(item, value)}
                      disabled={busyItemId === item.id}
                      label={`Quantity for ${item.product.name}`}
                    />
                    <strong className="price">{formatCurrency(item.lineTotal)}</strong>
                    <Button
                      variant="danger"
                      size="small"
                      loading={busyItemId === item.id}
                      onClick={() => handleRemove(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </article>
              );
            })}
            </div>
            <OrderSummary
              itemCount={itemCount}
              subtotal={cart.subtotal}
              total={cart.total}
              actionLabel="Continue to checkout"
              actionTo="/checkout"
              disabled={!cart.items.length}
              note="Checkout will recheck stock before creating the order."
            />
          </div>
          <ConfirmDialog
            open={clearDialogOpen}
            title="Clear your cart?"
            description="All items will be removed and their quantities returned to stock."
            confirmLabel="Clear cart"
            danger
            loading={clearing}
            onConfirm={handleClearCart}
            onClose={() => setClearDialogOpen(false)}
          />
        </>
      )}
    </section>
  );
}
