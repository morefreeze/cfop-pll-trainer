import type { PLLCase } from "./caseLibrary";
import { useLocalStorageState } from "../hooks/useLocalStorage";

export type ProficiencyLevel = 1 | 2 | 3; // 1=生疏, 2=一般, 3=熟练

export type ProficiencyMap = Record<string, ProficiencyLevel>;

const STORAGE_KEY = "CFOP_PLL_PROFICIENCY_V1";

export function getDefaultLevel(): ProficiencyLevel {
  return 1;
}

export function getLevel(map: ProficiencyMap, caseId: string): ProficiencyLevel {
  return map[caseId] ?? getDefaultLevel();
}

export function levelLabel(level: ProficiencyLevel): string {
  if (level === 1) return "生疏";
  if (level === 2) return "一般";
  return "熟练";
}

export function levelWeight(level: ProficiencyLevel): number {
  // 生疏权重更高，便于出题时“多抽弱项”
  if (level === 1) return 3;
  if (level === 2) return 2;
  return 1;
}

export function useProficiencyStore() {
  const [map, setMap] = useLocalStorageState<ProficiencyMap>(STORAGE_KEY, {});

  const setLevelForCase = (caseId: string, level: ProficiencyLevel) => {
    setMap((prev) => ({ ...prev, [caseId]: level }));
  };

  const resetAll = () => setMap({});

  return {
    map,
    setLevelForCase,
    resetAll,
  };
}

export function summarizeProficiency(cases: PLLCase[], map: ProficiencyMap) {
  const result = { level1: 0, level2: 0, level3: 0 };
  for (const c of cases) {
    const level = getLevel(map, c.id);
    if (level === 1) result.level1 += 1;
    else if (level === 2) result.level2 += 1;
    else result.level3 += 1;
  }
  return result;
}
