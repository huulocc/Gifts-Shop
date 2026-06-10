import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { FormField } from "../../components/common/FormField.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { validateRegister } from "../../utils/validation.js";

const initialValues = {
  fullName: "",
  phoneNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError("");
    try {
      await register(values);
      setValues(initialValues);
      navigate("/login", {
        replace: true,
        state: { message: "Account created. Please log in." },
      });
    } catch (error) {
      setErrors(error.fields || {});
      setFormError(error.message || "Could not create account.");
      setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card entry" aria-labelledby="register-title">
      <div className="stack">
        <p className="eyebrow">Customer account</p>
        <h1 id="register-title">Create your account</h1>
        <p className="muted">Registration creates Customer accounts only. Manager accounts are seeded.</p>
      </div>
      {formError ? <div className="alert alert-error">{formError}</div> : null}
      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Full name"
          required
          autoComplete="name"
          value={values.fullName}
          onChange={(value) => updateField("fullName", value)}
          error={errors.fullName}
        />
        <FormField
          label="Phone number"
          type="tel"
          autoComplete="tel"
          value={values.phoneNumber}
          onChange={(value) => updateField("phoneNumber", value)}
          helperText="Optional, used only as customer contact information."
        />
        <FormField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={(value) => updateField("email", value)}
          error={errors.email}
        />
        <FormField
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={values.password}
          onChange={(value) => updateField("password", value)}
          error={errors.password}
        />
        <FormField
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(value) => updateField("confirmPassword", value)}
          error={errors.confirmPassword}
        />
        <Button type="submit" loading={submitting} full>
          Create account
        </Button>
      </form>
      <p>
        Already have an account? <Link className="btn btn-tertiary" to="/login">Log in</Link>
      </p>
    </section>
  );
}
