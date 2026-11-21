"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { StatusResponse } from "@/types/api";

interface StatusValue {
  status: StatusResponse | null;
  loading: boolean;
  refresh: () => void;
}

const StatusContext = createContext<StatusValue | null>(null);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error("status failed");
      const body = (await response.json()) as StatusResponse;
      setStatus(body);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(() => ({ status, loading, refresh: load }), [status, loading, load]);

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

export function useProviderStatus(): StatusValue {
  const context = useContext(StatusContext);
  if (!context) throw new Error("useProviderStatus must be used inside StatusProvider");
  return context;
}
