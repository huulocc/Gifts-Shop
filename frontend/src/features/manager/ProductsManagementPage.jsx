import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { Drawer } from "../../components/common/Drawer.jsx";
import { FormField } from "../../components/common/FormField.jsx";
import { ManagerPageHeader } from "../../components/common/PageHeader.jsx";
import { SearchInput } from "../../components/common/SearchInput.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { EmptyState, ErrorState } from "../../components/common/StateViews.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { categoryService } from "../../services/categoryService.js";
import { productService } from "../../services/productService.js";
import { productFallbackImage } from "../../utils/constants.js";
import { formatCurrency, getStockState } from "../../utils/format.js";
import { validateProduct, validateStock } from "../../utils/validation.js";

const emptyProduct = {
  name: "",
  categoryId: "",
  description: "",
  unitPrice: "0.00",
  imageUrl: "",
  isActive: true,
  quantity: 0,
};

export function ProductsManagementPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formValues, setFormValues] = useState(emptyProduct);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [stockDrafts, setStockDrafts] = useState({});
  const [stockErrors, setStockErrors] = useState({});
  const [stockBusy, setStockBusy] = useState("");
  const { addToast } = useToast();

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        productService.listManagerProducts({ search, categoryId }),
        categoryService.listManagerCategories(),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setStockDrafts(
        nextProducts.reduce((drafts, product) => {
          drafts[product.id] = String(product.quantity);
          return drafts;
        }, {})
      );
    } catch (loadError) {
      setError(loadError.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [search, categoryId]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      if (activeFilter === "active") return product.isActive;
      if (activeFilter === "inactive") return !product.isActive;
      return true;
    });
  }, [products, activeFilter]);

  function openCreate() {
    setEditing(null);
    setFormValues({
      ...emptyProduct,
      categoryId: categories.find((category) => category.isActive)?.id || "",
    });
    setFormErrors({});
    setFormError("");
    setDrawerOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setFormValues({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      unitPrice: product.unitPrice,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      quantity: product.quantity,
    });
    setFormErrors({});
    setFormError("");
    setDrawerOpen(true);
  }

  function updateField(field, value) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateProduct(formValues);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      if (editing) {
        await productService.updateProduct(editing.id, formValues);
        addToast({ title: "Product saved." });
      } else {
        await productService.createProduct(formValues);
        addToast({ title: "Product created." });
      }
      setDrawerOpen(false);
      await loadProducts();
    } catch (saveError) {
      setFormErrors(saveError.fields || {});
      setFormError(saveError.message || "Could not save product.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveStock(product) {
    const draft = stockDrafts[product.id];
    const message = validateStock(Number(draft));
    setStockErrors((current) => ({ ...current, [product.id]: message }));
    if (message) return;
    setStockBusy(product.id);
    try {
      await productService.updateStock(product.id, Number(draft));
      addToast({ title: "Stock updated." });
      await loadProducts();
    } catch (stockError) {
      setStockErrors((current) => ({ ...current, [product.id]: stockError.message }));
    } finally {
      setStockBusy("");
    }
  }

  async function disableProduct() {
    if (!confirmProduct) return;
    setSubmitting(true);
    try {
      await productService.softDisableProduct(confirmProduct.id);
      addToast({ title: "Product disabled." });
      setConfirmProduct(null);
      await loadProducts();
    } catch (disableError) {
      addToast({ type: "error", title: "Could not disable product.", message: disableError.message });
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      key: "product",
      header: "Product",
      render: (product) => (
        <div className="cluster">
          <img
            src={product.imageUrl || productFallbackImage}
            alt={`${product.name} product photo`}
            style={{ width: 52, height: 44, borderRadius: 8, objectFit: "cover" }}
          />
          <div>
            <strong>{product.name}</strong>
            <p className="muted">{product.category?.name || "No category"}</p>
          </div>
        </div>
      ),
    },
    { key: "price", header: "Price", render: (product) => <span className="price">{formatCurrency(product.unitPrice)}</span> },
    {
      key: "stock",
      header: "Stock",
      render: (product) => (
        <div className="stack" style={{ minWidth: 160 }}>
          <StatusBadge type="stock" value={getStockState(product.quantity)} label={`${product.quantity} units`} />
          <div className="cluster">
            <input
              className="input"
              type="number"
              min="0"
              value={stockDrafts[product.id] ?? product.quantity}
              onChange={(event) => {
                setStockDrafts((current) => ({ ...current, [product.id]: event.target.value }));
                setStockErrors((current) => ({ ...current, [product.id]: "" }));
              }}
              aria-label={`Stock quantity for ${product.name}`}
              style={{ width: 96 }}
            />
            <Button
              variant="secondary"
              size="small"
              loading={stockBusy === product.id}
              onClick={() => saveStock(product)}
            >
              Save
            </Button>
          </div>
          {stockErrors[product.id] ? (
            <span className="field-error" role="alert">
              {stockErrors[product.id]}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product) => <StatusBadge value={product.isActive ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (product) => (
        <div className="row-actions">
          <Button variant="secondary" size="small" onClick={() => openEdit(product)}>
            Edit
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={() => setConfirmProduct(product)}
            disabled={!product.isActive}
          >
            Disable
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="stack-lg entry">
      <ManagerPageHeader
        title="Product and stock management"
        description="Maintain product details and quantities shown to customers."
        action={<Button onClick={openCreate}>Create product</Button>}
      />

      <div className="toolbar">
        <SearchInput
          label="Search products"
          value={search}
          onSearch={setSearch}
          placeholder="Bracelet, music box"
        />
        <label className="field">
          <span>Category</span>
          <select className="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Active state</span>
          <select className="select" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
            <option value="all">All products</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadProducts} />
      ) : (
        <DataTable
          caption="Product list"
          columns={columns}
          rows={visibleProducts}
          rowKey={(product) => product.id}
          loading={loading}
          emptyState={
            <EmptyState
              title="No products yet"
              description="Create a product before it appears in the customer shop."
              actionLabel="Create product"
              onAction={openCreate}
            />
          }
        />
      )}

      <Drawer
        open={drawerOpen}
        title={editing ? "Edit product" : "Create product"}
        onClose={() => setDrawerOpen(false)}
      >
        {formError ? <div className="alert alert-error" style={{ marginBottom: 18 }}>{formError}</div> : null}
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Product name"
            required
            value={formValues.name}
            onChange={(value) => updateField("name", value)}
            error={formErrors.name}
          />
          <FormField
            label="Category"
            required
            as="select"
            value={formValues.categoryId}
            onChange={(value) => updateField("categoryId", value)}
            error={formErrors.categoryId}
            options={[
              { value: "", label: "Choose category" },
              ...categories.map((category) => ({
                value: category.id,
                label: `${category.name}${category.isActive ? "" : " (inactive)"}`,
              })),
            ]}
          />
          <FormField
            label="Description"
            as="textarea"
            value={formValues.description}
            onChange={(value) => updateField("description", value)}
          />
          <FormField
            label="Unit price"
            type="number"
            min="0"
            step="0.01"
            required
            value={formValues.unitPrice}
            onChange={(value) => updateField("unitPrice", value)}
            error={formErrors.unitPrice}
          />
          <FormField
            label="Image URL"
            type="url"
            value={formValues.imageUrl}
            onChange={(value) => updateField("imageUrl", value)}
            error={formErrors.imageUrl}
            helperText="Optional. Use http or https when provided."
          />
          <FormField
            label="Stock quantity"
            type="number"
            min="0"
            step="1"
            required
            value={formValues.quantity}
            onChange={(value) => updateField("quantity", value)}
            error={formErrors.quantity}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={formValues.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Active product
          </label>
          <Button type="submit" loading={submitting}>
            Save product
          </Button>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmProduct)}
        title="Disable product"
        description={`Disable ${confirmProduct?.name || "this product"}? Customers will no longer see it, but managers can still review it.`}
        confirmLabel="Disable product"
        danger
        loading={submitting}
        onConfirm={disableProduct}
        onClose={() => setConfirmProduct(null)}
      />
    </section>
  );
}
