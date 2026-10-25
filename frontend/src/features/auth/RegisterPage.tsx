import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ErrorMessage } from "../../components/ErrorMessage";
import { SiteFooter } from "../../components/SiteFooter";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(name.trim(), email, password);
      navigate("/inventory", { replace: true });
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : "Unable to create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="auth-page flex-1">
        <section className="auth-card">
          <p className="eyebrow">HEGDE MOTORS</p>
          <h1>Create your account</h1>
          <p className="mb-6 text-sm text-slate-500">Join us to browse and purchase from our inventory.</p>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <form onSubmit={submit} className="space-y-4">
            <label className="field-label">Full name<input className="field-input" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="field-label">Email<input className="field-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="field-label">Password<input className="field-input" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><span className="text-xs font-normal text-slate-400">Use at least 8 characters.</span></label>
            <button className="button-primary w-full" type="submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-4" to="/login">Sign in</Link></p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
