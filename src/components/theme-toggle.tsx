"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themeOptions = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "系统", icon: Laptop }
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="theme-toggle" aria-label="主题切换">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = mounted && (theme ?? "system") === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={`切换到${option.label}模式`}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={active ? "theme-toggle-item theme-toggle-item-active" : "theme-toggle-item"}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}
