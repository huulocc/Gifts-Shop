import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { ManagerPageHeader } from "../../components/common/PageHeader.jsx";
import { SearchInput } from "../../components/common/SearchInput.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { EmptyState, ErrorState } from "../../components/common/StateViews.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { orderService } from "../../services/orderService.js";
import { orderStatuses } from "../../utils/constants.js";
import { formatCurrency, formatDate, formatStatus } from "../../utils/format.js";
import { validateOrderStatus } from "../../utils/validation.js";

export function ManagerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [statusDrafts, setStatusDrafts] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [confirmUpdate, setConfirmUpdate] = useState(null);
  const { addToast } = useToast();

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const nextOrders = await orderService.listAllOrders({ status, query });
      setOrders(nextOrders);
      setStatusDrafts(
        nextOrders.reduce((drafts, order) => {
          drafts[order.id] = order.orderStatus;
          return drafts;
        }, {})
      );
    } catch (loadError) {
      setError(loadError.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [status, query]);

  async function applyStatus(order, nextStatus) {
    const message = validateOrderStatus(nextStatus);
    setRowErrors((current) => ({ ...current, [order.id]: message }));
    if (message) return;
    setBusyOrderId(order.id);
    try {
      await orderService.updateStatus(order.id, nextStatus);
      addToast({ title: "Order status updated." });
      await loadOrders();
    } catch (statusError) {
      setRowErrors((current) => ({ ...current, [order.id]: statusError.message }));
    } finally {
      setBusyOrderId("");
      setConfirmUpdate(null);
    }
  }

  function requestStatusUpdate(order) {
    const nextStatus = statusDrafts[order.id];
    if (nextStatus === order.orderStatus) return;
    if (["cancelled", "completed"].includes(nextStatus)) {
      setConfirmUpdate({ order, nextStatus });
    } else {
      applyStatus(order, nextStatus);
    }
  }

  const columns = [
    {
      key: "id",
      header: "Order",
      render: (order) => (
        <Link className="btn btn-tertiary" to={`/manager/orders/${order.id}`}>
          {order.id.slice(0, 14)}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order) => (
        <div>
          <strong>{order.customer?.fullName || "Customer"}</strong>
          <p className="muted">{order.customer?.email}</p>
        </div>
      ),
    },
    { key: "date", header: "Date", render: (order) => <span className="mono">{formatDate(order.createdAt)}</span> },
    { key: "status", header: "Status", render: (order) => <StatusBadge value={order.orderStatus} /> },
    { key: "total", header: "Total", render: (order) => <span className="price">{formatCurrency(order.totalAmount)}</span> },
    {
      key: "update",
      header: "Update status",
      render: (order) => (
        <div className="status-update">
            <select
              className="select"
              value={statusDrafts[order.id] || order.orderStatus}
              onChange={(event) => {
                setStatusDrafts((current) => ({ ...current, [order.id]: event.target.value }));
                setRowErrors((current) => ({ ...current, [order.id]: "" }));
              }}
              aria-label={`Update status for ${order.id}`}
            >
              {orderStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>
            <Button
              size="small"
              variant="secondary"
              loading={busyOrderId === order.id}
              onClick={() => requestStatusUpdate(order)}
            >
              Save
            </Button>
          {rowErrors[order.id] ? <span className="field-error" role="alert">{rowErrors[order.id]}</span> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (order) => (
        <Button variant="secondary" size="small" to={`/manager/orders/${order.id}`}>
          Detail
        </Button>
      ),
    },
  ];

  return (
    <section className="stack-lg entry">
      <ManagerPageHeader
        title="Order management"
        description="View all customer orders, inspect payment information, and update order status."
      />

      <div className="toolbar">
        <SearchInput
          label="Search orders"
          value={query}
          onSearch={setQuery}
          placeholder="Order id or customer email"
        />
        <label className="field">
          <span>Status</span>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {orderStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadOrders} />
      ) : (
        <DataTable
          caption="Manager order list"
          columns={columns}
          rows={orders}
          rowKey={(order) => order.id}
          loading={loading}
          emptyState={
            <EmptyState
              title="No orders found"
              description="Clear filters or wait for a customer order."
              actionLabel="Clear filters"
              onAction={() => {
                setStatus("");
                setQuery("");
              }}
            />
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmUpdate)}
        title="Confirm status change"
        description={`Change ${confirmUpdate?.order.id || "this order"} to ${formatStatus(confirmUpdate?.nextStatus)}?`}
        confirmLabel="Update status"
        danger={confirmUpdate?.nextStatus === "cancelled"}
        loading={Boolean(busyOrderId)}
        onConfirm={() => confirmUpdate && applyStatus(confirmUpdate.order, confirmUpdate.nextStatus)}
        onClose={() => setConfirmUpdate(null)}
      />
    </section>
  );
}
