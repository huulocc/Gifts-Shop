import { useRef, useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { FormField } from "../../components/common/FormField.jsx";
import { ManagerPageHeader, PageHeader } from "../../components/common/PageHeader.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { validatePasswordChange } from "../../utils/validation.js";

const initialValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordPage({ actor }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef(null);
  const { changePassword } = useAuth();
  const { addToast } = useToast();
  const Header = actor === "manager" ? ManagerPageHeader : PageHeader;

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validatePasswordChange(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError("");
    try {
      await changePassword(values);
      setValues(initialValues);
      addToast({ title: "Password changed successfully." });
      firstFieldRef.current?.focus();
    } catch (error) {
      setErrors(error.fields || {});
      setFormError(error.message || "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={actor === "manager" ? "stack-lg entry" : "container section stack-lg entry"}>
      <Header
        eyebrow={actor === "customer" ? "Account" : undefined}
        title="Change password"
        description="Update your password after confirming the current one."
      />
      <div className="surface surface-padded" style={{ maxWidth: 560 }}>
        {formError ? <div className="alert alert-error" style={{ marginBottom: 18 }}>{formError}</div> : null}
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(value) => updateField("currentPassword", value)}
            error={errors.currentPassword}
            ref={firstFieldRef}
          />
          <FormField
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            value={values.newPassword}
            onChange={(value) => updateField("newPassword", value)}
            error={errors.newPassword}
          />
          <FormField
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
            error={errors.confirmPassword}
          />
          <Button type="submit" loading={submitting}>
            Update password
          </Button>
        </form>
      </div>
    </section>
  );
}
