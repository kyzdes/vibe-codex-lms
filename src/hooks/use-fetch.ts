"use client";

import { useState, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useFetch<T>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const execute = useCallback(
    async (url: string, options?: RequestInit): Promise<T | null> => {
      setState({ data: null, error: null, loading: true });
      try {
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json", ...options?.headers },
          ...options,
        });
        const json = await res.json();
        if (!res.ok) {
          const errorMsg = json.error?.fieldErrors
            ? Object.values(json.error.fieldErrors).flat().join(", ")
            : json.error || "Request failed";
          setState({ data: null, error: errorMsg, loading: false });
          return null;
        }
        setState({ data: json.data ?? json, error: null, loading: false });
        return json.data ?? json;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Network error";
        setState({ data: null, error: errorMsg, loading: false });
        return null;
      }
    },
    []
  );

  return { ...state, execute };
}
