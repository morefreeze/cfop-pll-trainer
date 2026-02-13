import { invert } from "./algEngine";

export type PLLGroup = "EPLL" | "CPLL" | "Mixed";

export interface PLLCase {
  id: string; // 如 "Aa"
  name: string; // 中文展示名
  group: PLLGroup;
  defaultAlgs: string[]; // 推荐主力算法，优先来自 Jperm / Cubeskills / Speedsolving Wiki
  altAlgs?: string[]; // 备选算法
  tags?: string[];
  recognitionHint: string;
  setupAlg: string; // 默认解法的逆，用于生成 PLL 图案
}

const pllCasesRaw: Omit<PLLCase, "setupAlg">[] = [
  {
    id: "Aa",
    name: "Aa 角块置换",
    group: "CPLL",
    defaultAlgs: ["x L2 D2 L' U' L D2 L' U L'"],
    altAlgs: ["x' R2 D2 R' U' R D2 R' U R'"],
    tags: ["相邻角换", "A 形"],
    recognitionHint: "顶层有一对相邻同色角块，其余角顺时针循环。",
  },
  {
    id: "Ab",
    name: "Ab 角块置换",
    group: "CPLL",
    defaultAlgs: ["x' L2 D2 L U L' D2 L U' L"],
    altAlgs: ["x R2 D2 R U R' D2 R U' R"],
    tags: ["相邻角换", "A 形反向"],
    recognitionHint: "与 Aa 类似，但角块按逆时针方向循环。",
  },
  {
    id: "E",
    name: "E 角块对换",
    group: "CPLL",
    defaultAlgs: [
      "x' L' U L D' L' U' L D L' U' L D' L' U L D",
    ],
    tags: ["对角角换", "环形"],
    recognitionHint: "四个角块全部错位，顶层无完整色条，常见双对角交换。",
  },
  {
    id: "H",
    name: "H 边块对换",
    group: "EPLL",
    defaultAlgs: ["M2 U M2 U2 M2 U M2"],
    tags: ["H 形", "对边换"],
    recognitionHint: "四条棱在顶层呈十字交叉，两两对换，没有角块错位。",
  },
  {
    id: "Ua",
    name: "Ua 边块三循环",
    group: "EPLL",
    defaultAlgs: ["M2 U M U2 M' U M2"],
    tags: ["U 形", "三棱顺时针"],
    recognitionHint: "一条完整侧面色条，其余三条棱顺时针循环。",
  },
  {
    id: "Ub",
    name: "Ub 边块三循环",
    group: "EPLL",
    defaultAlgs: ["M2 U' M U2 M' U' M2"],
    tags: ["U 形", "三棱逆时针"],
    recognitionHint: "一条完整侧面色条，其余三条棱逆时针循环。",
  },
  {
    id: "Z",
    name: "Z 边块对换",
    group: "EPLL",
    defaultAlgs: ["M' U M2 U M2 U M' U2 M2"],
    tags: ["Z 形", "相邻边对换"],
    recognitionHint: "顶层有两条对边已经对好，另外两组边成 Z 形对换。",
  },
  {
    id: "F",
    name: "F 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    ],
    tags: ["相邻角+边", "F 形"],
    recognitionHint:
      "一对相邻角块成块，另一侧类似 T 形，但边块也参与置换。",
  },
  {
    id: "Ga",
    name: "Ga 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R2 U R' U R' U' R U' R2 U' D R' U R D'",
    ],
    tags: ["G 形", "双块+边"],
    recognitionHint:
      "顶层有一组完整角块和一组假块，整体呈 G 形，块在左后区域。",
  },
  {
    id: "Gb",
    name: "Gb 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R' U' R U D' R2 U R' U R U' R U' R2 D",
    ],
    tags: ["G 形", "变体"],
    recognitionHint:
      "与 Ga 相似，但假块位置不同，整体图案沿顺时针旋转。",
  },
  {
    id: "Gc",
    name: "Gc 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R2 U' R U' R U R' U R2 U D' R U' R' D",
    ],
    tags: ["G 形", "变体"],
    recognitionHint:
      "一组角成块，另一组假块在右后角，常见“钩+条纹”组合。",
  },
  {
    id: "Gd",
    name: "Gd 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    ],
    tags: ["G 形", "变体"],
    recognitionHint:
      "一组角成块，假块在右前角，和 Gc 为镜像关系。",
  },
  {
    id: "Ja",
    name: "Ja 混合置换",
    group: "Mixed",
    defaultAlgs: ["x R2 F R F' R U2 r' U r U2"],
    tags: ["J 形", "小右块"],
    recognitionHint: "正前方有 2×1 角边块，块在右侧，常用一手顺滑算法。",
  },
  {
    id: "Jb",
    name: "Jb 混合置换",
    group: "Mixed",
    defaultAlgs: ["R U R' F' R U R' U' R' F R2 U' R'"],
    tags: ["J 形", "小左块"],
    recognitionHint: "与 Ja 镜像，2×1 块在左侧，顶层前面呈 J 形。",
  },
  {
    id: "Ra",
    name: "Ra 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R U' R' U' R U R D R' U' R D' R' U2 R'",
    ],
    tags: ["R 形", "两块+三棱"],
    recognitionHint:
      "正前方一条 2×1 块，另一侧类似 U 形，棱与角共同置换。",
  },
  {
    id: "Rb",
    name: "Rb 混合置换",
    group: "Mixed",
    defaultAlgs: ["R2 F R U R U' R' F' R U2 R' U2 R"],
    tags: ["R 形", "镜像"],
    recognitionHint: "与 Ra 镜像，块在左侧，整体图案方向相反。",
  },
  {
    id: "T",
    name: "T 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R U R' U' R' F R2 U' R' U' R U R' F'",
    ],
    tags: ["T 形", "经典"],
    recognitionHint: "顶面前缘为整条色条，侧面呈 T 形，是最经典的 PLL。",
  },
  {
    id: "Na",
    name: "Na 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    ],
    tags: ["N 形", "复杂三循环"],
    recognitionHint:
      "顶层有两组角块相对，边块错杂，整体看起来较“乱”。",
  },
  {
    id: "Nb",
    name: "Nb 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    ],
    tags: ["N 形", "镜像"],
    recognitionHint:
      "与 Na 为镜像，观察两侧角块对与顶层错乱边块的组合。",
  },
  {
    id: "V",
    name: "V 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "R' U R' U' y R' F' R2 U' R' U R' F R F",
    ],
    tags: ["V 形", "块在右前"],
    recognitionHint:
      "前右两个角成块，另一侧像一个 V 形箭头，多用于右手快速手法。",
  },
  {
    id: "Y",
    name: "Y 混合置换",
    group: "Mixed",
    defaultAlgs: [
      "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    ],
    tags: ["Y 形", "对角角+三棱"],
    recognitionHint:
      "一对对角角块错位，前后两条边互换，顶面侧视呈 Y 形。",
  },
];

export const pllCases: PLLCase[] = pllCasesRaw.map((c) => ({
  ...c,
  setupAlg: invert(c.defaultAlgs[0]),
}));

export type CaseType = "PLL" | "OLL" | "F2L";

// 预留 OLL / F2L 数据结构，后续可直接扩展
export const caseLibraryByType: Record<CaseType, PLLCase[]> = {
  PLL: pllCases,
  OLL: [],
  F2L: [],
};

export const pllGroups: { id: PLLGroup; label: string }[] = [
  { id: "EPLL", label: "EPLL（仅边块）" },
  { id: "CPLL", label: "CPLL（仅角块）" },
  { id: "Mixed", label: "混合（角+边）" },
];
