import { useEffect, useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { ErrorState, ProductGridSkeleton } from "../../components/common/StateViews.jsx";
import { ProductGrid } from "../../components/product/ProductGrid.jsx";
import { categoryService } from "../../services/categoryService.js";
import { productService } from "../../services/productService.js";

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHome() {
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        productService.listProducts(),
        categoryService.listCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (loadError) {
      setError(loadError.message || "Could not load storefront.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHome();
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid entry">
          <div className="hero-copy">
            <p className="eyebrow">GiftShop</p>
            <h1>Choose a gift that feels considered.</h1>
            <p className="lead">
              Browse active products, keep cart choices clear, and record simple payments for the academic flow.
            </p>
            <div className="cluster">
              <Button to="/products">Browse products</Button>
              <Button variant="secondary" to="/login">
                Log in
              </Button>
            </div>
          </div>
          <figure className="hero-card" aria-label="Wrapped gift product display">
            <img
              src="https://picsum.photos/seed/giftshop-curated-gifts/1200/1400"
              alt="Curated gift products arranged on a calm surface"
            />
            <figcaption className="hero-card-note">
              <strong>Customer and Manager only.</strong>
              <p className="muted">No guest shopping, vouchers, shipping providers, or gateway redirects in v1.</p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section">
        <div className="container stack-lg">
          <header className="page-header">
            <p className="eyebrow">Featured gifts</p>
            <h2 className="page-title">Active products ready to browse</h2>
          </header>
          {error ? (
            <ErrorState message={error} onRetry={loadHome} />
          ) : loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <ProductGrid products={products.slice(0, 4)} loading={false} />
          )}
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="surface surface-padded">
            <div className="between">
              <div className="stack">
                <h2>Browse by active category</h2>
                <p className="muted">Customer pages show only active categories and products.</p>
              </div>
              <div className="cluster">
                {loading
                  ? null
                  : categories.map((category) => (
                      <Button
                        key={category.id}
                        variant="secondary"
                        to={`/products?categoryId=${category.id}`}
                      >
                        {category.name}
                      </Button>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
