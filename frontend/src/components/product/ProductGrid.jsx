import { EmptyState, ProductGridSkeleton } from "../common/StateViews.jsx";
import { ProductCard } from "./ProductCard.jsx";

export function ProductGrid({ products, loading, emptyTitle, emptyDescription, onClear }) {
  if (loading) return <ProductGridSkeleton count={4} />;

  if (!products.length) {
    return (
      <EmptyState
        title={emptyTitle || "No gifts are available yet"}
        description={emptyDescription || "New gift picks will appear here soon."}
        actionLabel={onClear ? "Clear filters" : undefined}
        onAction={onClear}
      />
    );
  }

  return (
    <div className="product-grid" aria-live="polite">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  );
}
