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

  const featuredProducts = products.slice(0, 4);

  return (
    <>
      <section className="hero storefront-hero">
        <div className="container hero-grid entry">
          <div className="hero-copy">
            <p className="eyebrow">GiftShop</p>
            <h1>Thoughtful gifts for every small moment.</h1>
            <p className="lead">
              Browse keepsakes, journals, candles, and accessories ready for your next occasion.
            </p>
            <div className="cluster">
              <Button to="/products">Browse products</Button>
            </div>
          </div>
          <div className="hero-showcase" aria-label="GiftShop product display">
            <figure className="hero-flatlay">
              <img
                src="/images/giftshop-hero-flatlay.svg"
                alt="Wrapped gifts, a candle, a journal, ribbon, and a bracelet arranged on a soft rose surface"
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container stack-lg">
          <header className="storefront-section-header">
            <h2 className="page-title">Curated gifts to start with</h2>
            <p className="lead">Find gift picks with clear prices, categories, and availability before adding them to your cart.</p>
          </header>
          {error ? (
            <ErrorState message={error} onRetry={loadHome} />
          ) : loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <ProductGrid products={featuredProducts} loading={false} />
          )}
        </div>
      </section>

      <section className="section-tight home-curation-band">
        <div className="container">
          <div className="category-ribbon-panel category-ribbon-panel-wide">
            <div className="stack">
              <h2>Shop by category</h2>
              <p className="muted">Start with accessories, keepsakes, stationery, or cozy gift sets.</p>
            </div>
            <div className="category-ribbons">
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
      </section>
    </>
  );
}
