import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ErrorState } from "../../components/common/StateViews.jsx";
import { ProductFilterBar } from "../../components/product/ProductFilterBar.jsx";
import { ProductGrid } from "../../components/product/ProductGrid.jsx";
import { categoryService } from "../../services/categoryService.js";
import { productService } from "../../services/productService.js";

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId") || "";

  function updateParams(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    setSearchParams(params);
  }

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        productService.listProducts({ search, categoryId }),
        categoryService.listCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (loadError) {
      setError(loadError.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [search, categoryId]);

  function clearFilters() {
    setSearchParams({});
  }

  return (
    <section className="catalog-page section entry">
      <div className="container stack-lg">
        <div className="catalog-hero">
          <div className="catalog-hero-copy">
            <p className="eyebrow">Catalog</p>
            <h1 className="page-title">Find the right gift</h1>
            <p className="lead">
              Search by name, category, or the gift you have in mind.
            </p>
          </div>
          <ProductFilterBar
            search={search}
            categoryId={categoryId}
            categories={categories}
            resultCount={loading ? undefined : products.length}
            onSearch={(value) => updateParams({ search: value })}
            onCategoryChange={(value) => updateParams({ categoryId: value })}
            onClear={search || categoryId ? clearFilters : undefined}
          />
        </div>
        {error ? (
          <ErrorState message={error} onRetry={loadProducts} />
        ) : (
          <ProductGrid
            products={products}
            loading={loading}
            emptyTitle="No gifts match this search"
            emptyDescription="Clear the filters or try a broader product keyword."
            onClear={search || categoryId ? clearFilters : undefined}
          />
        )}
      </div>
    </section>
  );
}
