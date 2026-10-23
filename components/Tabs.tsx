"use client";

/** Pill tabs with a glowing indicator that glides between options. */
export function Tabs<T extends string>({
  items, value, onChange,
}: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const idx = Math.max(0, items.findIndex((i) => i.id === value));
  return (
    <div role="tablist" className="glass relative grid rounded-full p-1" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      <span
        aria-hidden
        className="absolute inset-y-1 right-1 rounded-full bg-gradient-to-l from-neon/25 to-violet/25 shadow-[0_0_20px_rgb(var(--neon)/.3)] ring-1 ring-neon/40 transition-transform duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]"
        style={{ width: `calc((100% - .5rem) / ${items.length})`, transform: `translateX(${-idx * 100}%)` }}
      />
      {items.map((i) => (
        <button
          key={i.id} role="tab" aria-selected={i.id === value} onClick={() => onChange(i.id)}
          className={`relative z-10 rounded-full px-4 py-2 text-sm transition-colors duration-300 ${i.id === value ? "font-bold text-neon" : "text-fg/65 hover:text-fg"}`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
