import type { PLLCase, PLLGroup } from "./caseLibrary";
import type { ProficiencyMap } from "./proficiencyStore";
import { levelWeight, getLevel } from "./proficiencyStore";

export type PracticeMode = "balanced" | "weighted";

export interface PracticeConfig {
  enabledGroups: PLLGroup[];
  excludedCaseIds: string[];
  mode: PracticeMode;
}

export function filterCasesForPractice(
  cases: PLLCase[],
  config: PracticeConfig,
): PLLCase[] {
  return cases.filter((c) => {
    if (!config.enabledGroups.includes(c.group)) return false;
    if (config.excludedCaseIds.includes(c.id)) return false;
    return true;
  });
}

export function chooseRandomCase(
  candidates: PLLCase[],
  proficiency: ProficiencyMap,
  mode: PracticeMode,
): PLLCase | null {
  if (!candidates.length) return null;
  if (mode === "balanced") {
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }

  // weighted：生疏权重更高
  const weights = candidates.map((c) => levelWeight(getLevel(proficiency, c.id)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    acc += weights[i];
    if (r <= acc) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
