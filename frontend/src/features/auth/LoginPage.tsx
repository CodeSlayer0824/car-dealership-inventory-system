import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ErrorMessage } from "../../components/ErrorMessage";
import { SiteFooter } from "../../components/SiteFooter";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(destination ?? "/inventory", { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="auth-page flex-1">
        <section className="auth-card">
          <p className="eyebrow">HEGDE MOTORS</p>
          <h1>Welcome back</h1>
          <p className="mb-6 text-sm text-slate-500">Sign in to explore the dealership inventory.</p>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <form onSubmit={submit} className="space-y-4">
            <label className="field-label">Email<input className="field-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="field-label">Password<input className="field-input" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="button-primary w-full" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">New to Hegde Motors? <Link className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-4" to="/register">Create an account</Link></p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
