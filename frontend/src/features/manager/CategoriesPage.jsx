import { useEffect, useState } from "react";
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
import { validateCategory } from "../../utils/validation.js";

const emptyCategory = {
  name: "",
  description: "",
  isActive: true,
};

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formValues, setFormValues] = useState(emptyCategory);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmCategory, setConfirmCategory] = useState(null);
  const { addToast } = useToast();

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const nextCategories = await categoryService.listManagerCategories({ search });
      setCategories(nextCategories);
    } catch (loadError) {
      setError(loadError.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [search]);

  function openCreate() {
    setEditing(null);
    setFormValues(emptyCategory);
    setFormErrors({});
    setFormError("");
    setDrawerOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
    setFormValues({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
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
    const nextErrors = validateCategory(formValues);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      if (editing) {
        await categoryService.updateCategory(editing.id, formValues);
        addToast({ title: "Category saved." });
      } else {
        await categoryService.createCategory(formValues);
        addToast({ title: "Category created." });
      }
      setDrawerOpen(false);
      await loadCategories();
    } catch (saveError) {
      setFormErrors(saveError.fields || {});
      setFormError(saveError.message || "Could not save category.");
    } finally {
      setSubmitting(false);
    }
  }

  async function disableCategory() {
    if (!confirmCategory) return;
    setSubmitting(true);
    try {
      await categoryService.softDisableCategory(confirmCategory.id);
      addToast({ title: "Category disabled." });
      setConfirmCategory(null);
      await loadCategories();
    } catch (disableError) {
      addToast({ type: "error", title: "Could not disable category.", message: disableError.message });
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "description", header: "Description", render: (category) => category.description || "No description" },
    {
      key: "status",
      header: "Status",
      render: (category) => (
        <StatusBadge value={category.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (category) => (
        <div className="row-actions">
          <Button variant="secondary" size="small" onClick={() => openEdit(category)}>
            Edit
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={() => setConfirmCategory(category)}
            disabled={!category.isActive}
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
        title="Category management"
        description="Create, edit, list, and soft-disable product categories."
        action={<Button onClick={openCreate}>Create category</Button>}
      />

      <div className="toolbar">
        <SearchInput
          label="Search categories"
          value={search}
          onSearch={setSearch}
          placeholder="Accessories, stationery"
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadCategories} />
      ) : (
        <DataTable
          caption="Manager category list"
          columns={columns}
          rows={categories}
          rowKey={(category) => category.id}
          loading={loading}
          emptyState={
            <EmptyState
              title="No categories yet"
              description="Create a category before adding products."
              actionLabel="Create category"
              onAction={openCreate}
            />
          }
        />
      )}

      <Drawer
        open={drawerOpen}
        title={editing ? "Edit category" : "Create category"}
        onClose={() => setDrawerOpen(false)}
      >
        {formError ? <div className="alert alert-error" style={{ marginBottom: 18 }}>{formError}</div> : null}
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Category name"
            required
            value={formValues.name}
            onChange={(value) => updateField("name", value)}
            error={formErrors.name}
          />
          <FormField
            label="Description"
            as="textarea"
            value={formValues.description}
            onChange={(value) => updateField("description", value)}
            error={formErrors.description}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={formValues.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Active category
          </label>
          <Button type="submit" loading={submitting}>
            Save category
          </Button>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmCategory)}
        title="Disable category"
        description={`Disable ${confirmCategory?.name || "this category"}? It remains visible to managers but hidden from public category filters.`}
        confirmLabel="Disable category"
        danger
        loading={submitting}
        onConfirm={disableCategory}
        onClose={() => setConfirmCategory(null)}
      />
    </section>
  );
}
