import { FormField } from "../common/FormField.jsx";
import { SearchInput } from "../common/SearchInput.jsx";
import { Button } from "../common/Button.jsx";

export function ProductFilterBar({
  search,
  categoryId,
  categories,
  onSearch,
  onCategoryChange,
  resultCount,
  onClear,
}) {
  const hasActiveFilters = Boolean(search || categoryId);
  const resultLabel =
    typeof resultCount === "number"
      ? `${resultCount} ${resultCount === 1 ? "gift" : "gifts"} shown`
      : "Loading gifts";

  return (
    <section className="filter-bar" aria-label="Product search and filters">
      <div className="filter-bar-header">
        <div>
          <p className="filter-kicker">Curated catalog</p>
          <p className="filter-result-count">{resultLabel}</p>
        </div>
        {hasActiveFilters && onClear ? (
          <Button variant="secondary" size="small" type="button" onClick={onClear}>
            Clear filters
          </Button>
        ) : null}
      </div>
      <div className="filter-bar-controls">
        <SearchInput
          label="Search products"
          value={search}
          onSearch={onSearch}
          placeholder="Bracelet, music box, journal"
        />
        <FormField
          label="Category"
          as="select"
          value={categoryId}
          onChange={onCategoryChange}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((category) => ({ value: category.id, label: category.name })),
          ]}
        />
      </div>
      <p className="muted filter-note">Search by name or choose a category to narrow the catalog.</p>
    </section>
  );
}
