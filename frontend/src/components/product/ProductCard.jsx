import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../common/Button.jsx";
import { StatusBadge } from "../common/StatusBadge.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { formatCurrency, getStockState } from "../../utils/format.js";
import { productFallbackImage } from "../../utils/constants.js";

export function ProductCard({ product }) {
  const [adding, setAdding] = useState(false);
  const { role, user } = useAuth();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const stockState = getStockState(product.quantity);
  const canAdd = product.isActive && product.quantity > 0;

  async function handleAdd() {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (role !== "customer") {
      addToast({
        type: "error",
        title: "Customer account required.",
        message: "Managers do not use cart or checkout flows.",
      });
      return;
    }
    setAdding(true);
    try {
      await addItem({ productId: product.id, quantity: 1 });
    } catch (error) {
      addToast({
        type: "error",
        title: "Could not add item.",
        message: error.message,
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="product-card">
      <Link className="product-card-image" to={`/products/${product.id}`}>
        <img
          src={product.imageUrl || productFallbackImage}
          alt={`${product.name} product photo`}
          loading="lazy"
        />
      </Link>
      <div className="product-card-body">
        <div className="between">
          <p className="muted">{product.category?.name || "Gift"}</p>
          <StatusBadge type="stock" value={stockState} />
        </div>
        <h2 className="product-card-title">
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h2>
        <p className="muted">{product.description}</p>
        <div className="between">
          <span className="price">{formatCurrency(product.unitPrice)}</span>
          <Button
            size="small"
            onClick={handleAdd}
            disabled={!canAdd || adding}
            loading={adding}
          >
            {canAdd ? "Add" : "Unavailable"}
          </Button>
        </div>
      </div>
    </article>
  );
}
