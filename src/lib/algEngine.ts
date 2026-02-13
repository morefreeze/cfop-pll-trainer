import { Alg } from "cubing/alg";

export interface ParsedAlg {
  raw: string;
  normalized: string;
  steps: string[];
}

export interface IdentityResult {
  isIdentity: boolean;
  simplified: string;
  remainingMoves: number;
}

export interface CaseState {
  // 从复原态到该案例图案的算法（通常为默认解法的逆）
  setupAlg: string;
}

export interface ApplyResult extends IdentityResult {
  combined: string;
}

function normalizeWithAlg(algStr: string): ParsedAlg {
  const alg = new Alg(algStr) as any;
  const expanded = typeof alg.expand === "function" ? alg.expand() : alg;
  const normalized = String(expanded).trim();
  const steps = normalized.length ? normalized.split(/\s+/) : [];
  return {
    raw: algStr,
    normalized,
    steps,
  };
}

// 将单步动作字符串解析为“底层 + 次数”的形式，用于同面合并
function parseMoveToken(move: string): { base: string; power: number } | null {
  const match = /^([RUFLDBMESxyzrlud][w]?)(2|'|2'|)$/i.exec(move);
  if (!match) return null;
  const base = match[1];
  const suffix = match[2] ?? "";

  let power = 0;
  if (suffix === "") power = 1;
  else if (suffix === "'") power = -1;
  else if (suffix.startsWith("2")) power = 2;

  return { base, power };
}

// 仅做“同一面连续动作”的模 4 约简，不尝试更复杂的群化简
export function simplifySteps(steps: string[]): string[] {
  const stack: { base: string; power: number }[] = [];

  for (const step of steps) {
    const parsed = parseMoveToken(step);
    if (!parsed) {
      // 未识别的符号直接保留，避免误删信息
      stack.push({ base: step, power: 0 });
      continue;
    }

    const last = stack[stack.length - 1];
    if (last && last.base === parsed.base) {
      const merged = ((last.power + parsed.power) % 4 + 4) % 4;
      stack.pop();
      if (merged !== 0) {
        stack.push({ base: parsed.base, power: merged });
      }
    } else {
      stack.push(parsed);
    }
  }

  return stack.map((item) => {
    if (item.power === 0) return item.base; // 未识别符号
    if (item.power === 1) return item.base;
    if (item.power === 2) return `${item.base}2`;
    if (item.power === 3) return `${item.base}'`;
    return item.base;
  });
}

export function parse(algStr: string): ParsedAlg {
  try {
    return normalizeWithAlg(algStr);
  } catch {
    throw new Error("算法解析失败，请检查符号与空格是否符合 WCA/SiGN 记法。");
  }
}

export function toSteps(algStr: string): string[] {
  return parse(algStr).steps;
}

export function isIdentity(algStr: string): IdentityResult {
  const parsed = parse(algStr);
  const simplifiedSteps = simplifySteps(parsed.steps);
  const simplified = simplifiedSteps.join(" ");
  return {
    isIdentity: simplifiedSteps.length === 0,
    simplified,
    remainingMoves: simplifiedSteps.length,
  };
}

export function applyToCase(algStr: string, caseState: CaseState): ApplyResult {
  const combined = `${caseState.setupAlg} ${algStr}`.trim();
  const parsed = parse(combined);
  const simplifiedSteps = simplifySteps(parsed.steps);
  const simplified = simplifiedSteps.join(" ");
  return {
    combined,
    isIdentity: simplifiedSteps.length === 0,
    simplified,
    remainingMoves: simplifiedSteps.length,
  };
}

export function invert(algStr: string): string {
  const alg = new Alg(algStr) as any;
  const inverted = typeof alg.invert === "function" ? alg.invert() : alg;
  const expanded = typeof inverted.expand === "function" ? inverted.expand() : inverted;
  return String(expanded).trim();
}
