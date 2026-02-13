import { useEffect, useState } from "react";

// 通用 localStorage 状态 Hook，所有持久化模块共用
export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // 忽略配额等错误，保持 UI 可用
    }
  }, [key, state]);

  return [state, setState] as const;
}
