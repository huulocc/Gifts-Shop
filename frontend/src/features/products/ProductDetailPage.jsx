import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";
import { DetailSkeleton, ErrorState } from "../../components/common/StateViews.jsx";
import { QuantityStepper } from "../../components/common/QuantityStepper.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { ProductGrid } from "../../components/product/ProductGrid.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { productService } from "../../services/productService.js";
import { productFallbackImage } from "../../utils/constants.js";
import { formatCurrency, getStockState } from "../../utils/format.js";
import { validateQuantity } from "../../utils/validation.js";

export function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const { user, role } = useAuth();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadProduct() {
    setLoading(true);
    setError("");
    try {
      const nextProduct = await productService.getProduct(productId);
      setProduct(nextProduct);
      setQuantity(nextProduct.quantity > 0 ? 1 : 0);
      const nextRelated = await productService.listProducts({
        categoryId: nextProduct.categoryId,
      });
      setRelated(nextRelated.filter((item) => item.id !== nextProduct.id).slice(0, 4));
    } catch (loadError) {
      setError(loadError.message || "Product is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function handleAdd() {
    if (!product) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
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
    const validationMessage = validateQuantity(Number(quantity), product.quantity);
    setQuantityError(validationMessage);
    if (validationMessage) return;
    setAdding(true);
    try {
      await addItem({ productId: product.id, quantity: Number(quantity) });
      await loadProduct();
    } catch (addError) {
      addToast({ type: "error", title: "Could not add item.", message: addError.message });
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <section className="container section">
        <DetailSkeleton />
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="container section">
        <ErrorState
          title="Product unavailable"
          message={error || "This product could not be found."}
          secondaryTo="/products"
          secondaryLabel="Back to products"
        />
      </section>
    );
  }

  const stockState = getStockState(product.quantity);
  const canAdd = product.quantity > 0 && product.isActive;

  return (
    <section className="container section stack-lg entry product-detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link className="btn btn-tertiary" to="/">
          Home
        </Link>
        <span>/</span>
        <Link className="btn btn-tertiary" to="/products">
          Products
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="detail-grid">
        <div className="detail-media-column">
          <figure className="detail-image">
            <img
              src={product.imageUrl || productFallbackImage}
              alt={`${product.name} product photo`}
            />
          </figure>
          <aside className="detail-trust-panel" aria-label="Gift-ready details">
            <h2>Good for gifting</h2>
            <div className="gift-ready-list">
              <span>Ready for birthdays</span>
              <span>Pairs with a gift message</span>
              <span>Easy to review in cart</span>
            </div>
          </aside>
        </div>

        <article className="surface surface-padded stack-lg detail-purchase-panel">
          <div className="stack">
            <p className="eyebrow">{product.category?.name || "Gift"}</p>
            <h1 className="page-title">{product.name}</h1>
            <p className="detail-description">{product.description}</p>
          </div>

          <div className="detail-price-row">
            <span className="price detail-price">
              {formatCurrency(product.unitPrice)}
            </span>
            <StatusBadge type="stock" value={stockState} />
          </div>

          <div className="detail-meta-grid">
            <div>
              <span>Category</span>
              <strong>{product.category?.name || "Gift"}</strong>
            </div>
            <div>
              <span>Stock</span>
              <strong>{product.quantity} available</strong>
            </div>
          </div>

          <div className="detail-quantity-panel">
            <label className="radio-group-label" htmlFor="product-quantity">
              Quantity
            </label>
            <QuantityStepper
              id="product-quantity"
              value={quantity}
              min={1}
              max={Math.max(1, product.quantity)}
              onChange={(value) => {
                setQuantity(value);
                setQuantityError(validateQuantity(Number(value), product.quantity));
              }}
              disabled={!canAdd}
              label="Product quantity"
            />
            {quantityError ? <span className="field-error" role="alert">{quantityError}</span> : null}
            <p className="muted">Choose from the available stock before adding this gift to cart.</p>
          </div>
          <Button onClick={handleAdd} loading={adding} loadingLabel="Adding to cart" disabled={!canAdd} full>
            {canAdd ? "Add to cart" : "Out of stock"}
          </Button>
        </article>
      </div>

      <section className="stack-lg related-products-section" aria-labelledby="related-title">
        <header className="storefront-section-header">
          <h2 id="related-title">More from this category</h2>
          <p className="lead">Keep browsing active gifts with the same category direction.</p>
        </header>
        <ProductGrid
          products={related}
          loading={false}
          emptyTitle="No related gifts yet"
          emptyDescription="Try browsing the full catalog for more gifts."
        />
      </section>
    </section>
  );
}
