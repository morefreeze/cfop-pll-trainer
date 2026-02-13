import { useLocalStorageState } from "../hooks/useLocalStorage";

export type AlgPreferenceMap = Record<string, string>;

const STORAGE_KEY = "CFOP_PLL_ALG_PREFERENCE_V1";

/**
 * 纯函数工具：从给定的 map 中读取某个案例的主力算法，若不存在则返回 fallback。
 */
export function getPrimaryFromMap(
  map: AlgPreferenceMap,
  caseId: string,
  fallbackDefault: string,
): string {
  const stored = map[caseId];
  const cleaned = stored?.trim();
  if (!cleaned) return fallbackDefault;
  return cleaned;
}

/**
 * 主力算法偏好 Store
 * - 使用 localStorage 持久化每个 PLL 案例的主力算法
 * - 形如 { [caseId]: primaryAlg }
 */
export function useAlgPreferenceStore() {
  const [map, setMap] = useLocalStorageState<AlgPreferenceMap>(STORAGE_KEY, {});

  const setPrimary = (caseId: string, alg: string) => {
    const trimmed = alg.trim();
    if (!trimmed) return;
    setMap((prev) => ({ ...prev, [caseId]: trimmed }));
  };

  const getPrimary = (caseId: string, fallbackDefault: string) =>
    getPrimaryFromMap(map, caseId, fallbackDefault);

  return {
    map,
    setPrimary,
    getPrimary,
  };
}
