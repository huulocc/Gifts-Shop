import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";
import { OrderSummary } from "../../components/common/OrderSummary.jsx";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { DetailSkeleton, ErrorState } from "../../components/common/StateViews.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { orderService } from "../../services/orderService.js";
import { formatAddress, formatCurrency, formatDateTime, formatStatus } from "../../utils/format.js";

export function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { addToast } = useToast();

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      setOrder(await orderService.getMyOrder(orderId));
    } catch (loadError) {
      setError(loadError.message || "Could not load order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function placeOrder() {
    if (!order) return;
    setConfirming(true);
    setError("");
    try {
      const nextOrder = await orderService.placeOrder(order.id);
      setOrder(nextOrder);
      setSuccess("Payment confirmed.");
      addToast({ title: "Payment confirmed." });
    } catch (paymentError) {
      setError(paymentError.message || "Could not confirm payment.");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <section className="container section">
        <DetailSkeleton />
      </section>
    );
  }

  if (!order) {
    return (
      <section className="container section">
        <ErrorState title="Order unavailable" message={error} secondaryTo="/orders" secondaryLabel="Back to orders" />
      </section>
    );
  }

  const canConfirmPayment = order.orderStatus === "pending";
  const paymentConfirmed = ["placed", "paid", "completed"].includes(order.orderStatus);

  return (
    <section className="container section stack-lg entry">
      <PageHeader
        eyebrow="Payment"
        title="Confirm payment"
        description="Review your order total and confirm the payment method you selected."
      />
      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}
      <div className="checkout-layout">
        <section className="surface surface-padded stack-lg">
          <div className="between">
            <div>
              <h2>{order.id}</h2>
              <p className="muted">Created {formatDateTime(order.createdAt)}</p>
            </div>
            <StatusBadge value={order.orderStatus} />
          </div>
          <div className="stack">
            <p>
              Recipient: <strong>{order.recipientName || "Not provided"}</strong>
            </p>
            <p className="muted">
              {order.recipientPhone || "No recipient phone"} - {formatAddress(order.shippingAddress)}
            </p>
            <p>
              Method: <strong>{formatStatus(order.paymentMethod)}</strong>
            </p>
            {Number(order.discountAmount || 0) > 0 ? (
              <p>
                Discount: <strong className="price">-{formatCurrency(order.discountAmount)}</strong>
                {order.voucher?.code ? <span className="muted"> using {order.voucher.code}</span> : null}
              </p>
            ) : null}
            <p>
              Amount due: <strong className="price">{formatCurrency(order.totalAmount)}</strong>
            </p>
            {order.payments.length ? (
              <div className="stack">
                <h3>Payment details</h3>
                {order.payments.map((payment) => (
                  <p className="muted" key={payment.id}>
                    {formatStatus(payment.status)} payment for {formatCurrency(payment.amount)} on{" "}
                    {formatDateTime(payment.paymentDate)}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          <div className="cluster">
            {canConfirmPayment ? (
              <Button onClick={placeOrder} loading={confirming}>
                Confirm payment
              </Button>
            ) : paymentConfirmed ? (
              <span className="alert alert-success">Payment has already been confirmed.</span>
            ) : (
              <span className="alert alert-error">Payment cannot be changed for this order.</span>
            )}
            <Link className="btn btn-secondary" to={`/orders/${order.id}`}>
              View order
            </Link>
          </div>
        </section>
        <OrderSummary
          itemCount={order.items.reduce((sum, item) => sum + item.quantity, 0)}
          subtotal={order.subtotalAmount}
          discount={order.discountAmount}
          voucher={order.voucher}
          total={order.totalAmount}
          paymentMethod={order.paymentMethod}
          note="After confirmation, your order will move into processing."
        />
      </div>
    </section>
  );
}
