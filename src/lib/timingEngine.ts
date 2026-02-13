import type { PLLGroup } from "./caseLibrary";

export type Penalty = "OK" | "+2" | "DNF";

export interface SolveRecord {
  id: string;
  caseId: string;
  group: PLLGroup;
  timeMs: number;
  penalty: Penalty;
  timestamp: number;
}

export interface TimingStats {
  average: number | null;
  median: number | null;
  ao5: number | null;
  ao12: number | null;
  pb: number | null;
}

export const TIMING_STORAGE_KEY = "CFOP_PLL_SOLVES_V1";

export function applyPenalty(timeMs: number, penalty: Penalty): number | null {
  if (penalty === "DNF") return null;
  if (penalty === "+2") return timeMs + 2000;
  return timeMs;
}

function numericTimes(records: SolveRecord[]): number[] {
  const arr: number[] = [];
  for (const r of records) {
    const t = applyPenalty(r.timeMs, r.penalty);
    if (t != null && Number.isFinite(t)) arr.push(t);
  }
  return arr;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((s, v) => s + v, 0);
  return sum / values.length;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function best(values: number[]): number | null {
  if (!values.length) return null;
  return Math.min(...values);
}

export function computeAoN(records: SolveRecord[], n: number): number | null {
  if (records.length < n) return null;
  const window = records.slice(-n);
  const times = window.map((r) => applyPenalty(r.timeMs, r.penalty));
  const dnfs = times.filter((t) => t == null).length;
  if (dnfs > 1) return null;

  const finite = times.filter((t): t is number => t != null).sort((a, b) => a - b);
  if (finite.length < 3) return null;
  // 去掉一个最好和一个最差
  const trimmed = finite.slice(1, finite.length - 1);
  return average(trimmed);
}

export function computeStats(records: SolveRecord[]): TimingStats {
  const times = numericTimes(records);
  const ao5 = computeAoN(records, 5);
  const ao12 = computeAoN(records, 12);
  return {
    average: average(times),
    median: median(times),
    ao5,
    ao12,
    pb: best(times),
  };
}

export function formatTime(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "-";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
  }
  return seconds.toFixed(2);
}

export function filterSolves(
  solves: SolveRecord[],
  options: { caseId?: string; group?: PLLGroup },
): SolveRecord[] {
  return solves.filter((s) => {
    if (options.caseId && s.caseId !== options.caseId) return false;
    if (options.group && s.group !== options.group) return false;
    return true;
  });
}

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  solves: SolveRecord[];
}

export function buildExportPayload(solves: SolveRecord[]): ExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    solves,
  };
}

export function parseExportPayload(json: string): SolveRecord[] {
  const data = JSON.parse(json) as ExportPayload | SolveRecord[];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).solves)) {
    return (data as any).solves as SolveRecord[];
  }
  throw new Error("JSON 结构不符合计时导入格式。");
}
