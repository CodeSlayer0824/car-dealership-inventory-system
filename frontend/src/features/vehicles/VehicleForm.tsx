import { useState, type FormEvent } from "react";
import type { Vehicle, VehicleInput } from "../../types/vehicle";

export function VehicleForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Vehicle;
  onSubmit: (input: VehicleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        make: make.trim(),
        model: model.trim(),
        category: category.trim(),
        price: Number(price),
        quantity: Number(quantity),
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{initial ? "Update vehicle" : "Add a vehicle"}</h2>
        <button type="button" className="text-sm font-semibold text-slate-500 hover:text-ink" onClick={onCancel}>Cancel</button>
      </div>
      {error && <p className="mb-3 text-sm text-rose-700" role="alert">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field-label">Make<input required maxLength={100} className="field-input" value={make} onChange={(event) => setMake(event.target.value)} /></label>
        <label className="field-label">Model<input required maxLength={100} className="field-input" value={model} onChange={(event) => setModel(event.target.value)} /></label>
        <label className="field-label">Category<input required maxLength={80} className="field-input" value={category} onChange={(event) => setCategory(event.target.value)} /></label>
        <label className="field-label">Price (USD)<input required type="number" min="0" step="0.01" className="field-input" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
        <label className="field-label">Quantity in stock<input required type="number" min="0" step="1" className="field-input" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      </div>
      <button className="button-primary mt-5" type="submit" disabled={saving}>{saving ? "Saving..." : initial ? "Save changes" : "Add vehicle"}</button>
    </form>
  );
}
