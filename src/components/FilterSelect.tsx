"use client";

import type { ReactNode } from "react";

/** A filter <select> that submits its form as soon as it changes. */
export function FilterSelect({ name, label, value, children }: { name: string; label: string; value: string; children: ReactNode }) {
  return (
    <select name={name} aria-label={label} defaultValue={value} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      {children}
    </select>
  );
}
