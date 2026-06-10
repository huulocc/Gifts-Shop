import { FormField } from "../common/FormField.jsx";
import { SearchInput } from "../common/SearchInput.jsx";

export function ProductFilterBar({ search, categoryId, categories, onSearch, onCategoryChange }) {
  return (
    <div className="filter-bar">
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
      <p className="muted filter-note">Inactive products are hidden from customer browsing.</p>
    </div>
  );
}
