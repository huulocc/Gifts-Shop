import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { FormField } from "../../components/common/FormField.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { validateLogin } from "../../utils/validation.js";

export function LoginPage() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const successMessage = location.state?.message || "";

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setFormError("");
    try {
      const user = await login(values);
      const redirect = searchParams.get("redirect");
      navigate(redirect || (user.role === "manager" ? "/manager" : "/products"), {
        replace: true,
      });
    } catch (error) {
      setErrors(error.fields || {});
      setFormError(error.message || "Invalid email or password.");
      setValues((current) => ({ ...current, password: "" }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card entry" aria-labelledby="login-title">
      <div className="stack">
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-title">Log in to GiftShop</h1>
        <p className="muted">Log in to review orders, finish checkout, and manage your account.</p>
      </div>
      {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}
      {formError ? <div className="alert alert-error">{formError}</div> : null}
      <form className="form-grid" onSubmit={handleSubmit} noValidate>
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
          autoComplete="current-password"
          value={values.password}
          onChange={(value) => updateField("password", value)}
          error={errors.password}
        />
        <Button type="submit" loading={submitting} full>
          Log in
        </Button>
      </form>
      <p>
        Need a customer account? <Link className="btn btn-tertiary" to="/register">Register</Link>
      </p>
    </section>
  );
}
