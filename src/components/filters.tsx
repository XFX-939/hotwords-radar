"use client";

import { CATEGORIES, TIME_RANGES } from "@/lib/types";

interface SourceOption {
  id: string;
  name: string;
}

export function FilterBar({
  range,
  category,
  source,
  sort,
  search,
  sources = [],
  onRange,
  onCategory,
  onSource,
  onSort,
  onSearch
}: {
  range?: string;
  category?: string;
  source?: string;
  sort?: string;
  search?: string;
  sources?: SourceOption[];
  onRange?: (value: string) => void;
  onCategory?: (value: string) => void;
  onSource?: (value: string) => void;
  onSort?: (value: string) => void;
  onSearch?: (value: string) => void;
}) {
  return (
    <div className="glass-panel mb-5 flex flex-col gap-3 rounded-lg p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TIME_RANGES.map((item) => (
          <button
            key={item.value}
            onClick={() => onRange?.(item.value)}
            className={`h-9 shrink-0 rounded-md px-3 text-sm transition ${
              range === item.value ? "chip-active" : "chip-ghost"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {onSearch ? (
          <input
            value={search ?? ""}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索热词"
            className="form-control h-9 rounded-md px-3 text-sm"
          />
        ) : null}
        <select
          value={category ?? "全部"}
          onChange={(event) => onCategory?.(event.target.value)}
          className="form-control h-9 rounded-md px-3 text-sm"
        >
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={source ?? "all"}
          onChange={(event) => onSource?.(event.target.value)}
          className="form-control h-9 rounded-md px-3 text-sm"
        >
          <option value="all">全部数据源</option>
          {sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {onSort ? (
          <select
            value={sort ?? "heat"}
            onChange={(event) => onSort(event.target.value)}
            className="form-control h-9 rounded-md px-3 text-sm"
          >
            <option value="heat">按热度</option>
            <option value="growth">按涨幅</option>
            <option value="appeared">按出现时间</option>
            <option value="updated">按更新时间</option>
          </select>
        ) : null}
      </div>
    </div>
  );
}
