"use client";

import { useCallback, useEffect, useState } from "react";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
}

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { cache: "no-store" });
      const json = (await response.json()) as ApiEnvelope<T>;
      if (!response.ok || json.error) {
        throw new Error(json.error ?? "请求失败");
      }
      setData(json.data ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.addEventListener("hotwords:refresh", load);
    return () => window.removeEventListener("hotwords:refresh", load);
  }, [load]);

  return { data, loading, error, refetch: load, setData };
}
