"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, Database, FileText, GitBranch, Home, Radar, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { siteConfig } from "@/lib/site";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/trending", label: "热点榜", icon: BarChart3 },
  { href: "/map", label: "关系图", icon: GitBranch },
  { href: "/daily", label: "日报", icon: FileText },
  { href: "/sources", label: "数据源", icon: Database }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function refreshData() {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      router.refresh();
      window.dispatchEvent(new CustomEvent("hotwords:refresh"));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="nav-shell fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="brand-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
              <Radar size={19} />
            </span>
            <span className="min-w-0">
              <span className="text-primary block max-w-[10rem] truncate text-sm font-semibold tracking-wide sm:max-w-none sm:text-base">
                {siteConfig.name}
              </span>
              <span className="text-secondary hidden text-xs sm:block">{siteConfig.subtitle}</span>
            </span>
          </Link>

          <nav className="no-scrollbar hidden flex-1 items-center justify-center gap-1 overflow-x-auto md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    active ? "nav-link-active" : "nav-link"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="btn-primary hidden h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{refreshing ? "刷新中" : "刷新"}</span>
            </button>
          </div>
        </div>
        <div className="mobile-nav-shell no-scrollbar flex gap-1 overflow-x-auto px-3 py-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${
                  active ? "nav-link-active" : "nav-link"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="radar-grid mx-auto min-h-screen max-w-7xl px-4 pb-12 pt-24 sm:px-6 md:pt-24">
        <div className="text-muted mb-6 flex flex-wrap items-center gap-2 text-xs">
          <Activity size={14} />
          <span>Mock pipeline 已接入数据库，AI 分析接口预留中</span>
        </div>
        {children}
      </main>
    </div>
  );
}
