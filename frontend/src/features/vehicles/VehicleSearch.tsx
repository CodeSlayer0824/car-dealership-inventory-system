import { useState, type FormEvent } from "react";
import type { VehicleFilters } from "../../types/vehicle";

export function VehicleSearch({ onSearch }: { onSearch: (filters: VehicleFilters) => void }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({
      ...(make.trim() ? { make: make.trim() } : {}),
      ...(model.trim() ? { model: model.trim() } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
    });
  }

  function clear() {
    setMake("");
    setModel("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    onSearch({});
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-2 xl:grid-cols-6">
      <label className="field-label">
        Make
        <input className="field-input" value={make} onChange={(event) => setMake(event.target.value)} placeholder="e.g. Toyota" />
      </label>
      <label className="field-label">
        Model
        <input className="field-input" value={model} onChange={(event) => setModel(event.target.value)} placeholder="e.g. Corolla" />
      </label>
      <label className="field-label">
        Category
        <input className="field-input" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. SUV" />
      </label>
      <label className="field-label">
        Minimum price
        <input className="field-input" type="number" min="0" step="0.01" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="$0" />
      </label>
      <label className="field-label">
        Maximum price
        <input className="field-input" type="number" min="0" step="0.01" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No limit" />
      </label>
      <div className="flex items-end gap-2">
        <button className="button-primary flex-1" type="submit">Search inventory</button>
        <button className="button-secondary" type="button" onClick={clear} aria-label="Clear filters">Clear</button>
      </div>
    </form>
  );
}
