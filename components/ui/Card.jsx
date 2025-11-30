'use client';

export default function Card({ title, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      <header className="flex items-center justify-between mb-4">
        {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : <span />}
        {action || null}
      </header>
      {children}
    </section>
  );
}

