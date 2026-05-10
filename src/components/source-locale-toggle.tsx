"use client";

import { SOURCE_LOCALES, type SourceLocale } from "@/lib/types";

export function SourceLocaleToggle({
  value,
  onChange,
  className = ""
}: {
  value: SourceLocale;
  onChange: (value: SourceLocale) => void;
  className?: string;
}) {
  return (
    <div className={`no-scrollbar flex gap-2 overflow-x-auto ${className}`}>
      {SOURCE_LOCALES.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`h-9 shrink-0 rounded-md px-3 text-sm transition ${
            value === item.value ? "chip-active" : "chip-ghost"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
