import { EmptyState, ProductGridSkeleton } from "../common/StateViews.jsx";
import { ProductCard } from "./ProductCard.jsx";

export function ProductGrid({ products, loading, emptyTitle, emptyDescription, onClear }) {
  if (loading) return <ProductGridSkeleton count={4} />;

  if (!products.length) {
    return (
      <EmptyState
        title={emptyTitle || "No active products are available yet"}
        description={emptyDescription || "Manager-created active products will appear here."}
        actionLabel={onClear ? "Clear search" : undefined}
        onAction={onClear}
      />
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  );
}
