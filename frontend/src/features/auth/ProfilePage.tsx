import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { ErrorMessage } from "../../components/ErrorMessage";
import { getProfile } from "./authApi";

export function ProfilePage() {
  const { user, updateName } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) setName(profile.user.name);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load your profile");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updateName(name.trim());
      setNotice("Your name has been updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update your profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 lg:px-8 lg:py-12">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-ink">Profile</h1>
      <p className="mt-2 text-sm text-slate-600">Update the name shown on your account and orders.</p>
      <form className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card" onSubmit={submit}>
        {error && <ErrorMessage message={error} />}
        {notice && <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">{notice}</p>}
        <label className="field-label">
          Name
          <input className="field-input" required minLength={1} maxLength={100} disabled={loading} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div>
          <p className="field-label">Email</p>
          <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{user?.email}</p>
        </div>
        <button className="button-primary" type="submit" disabled={loading || saving}>{loading ? "Loading profile..." : saving ? "Saving..." : "Save name"}</button>
      </form>
    </main>
  );
}
