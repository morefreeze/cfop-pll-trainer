import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ScrollArea } from "./components/ui/scroll-area";

import {
  BarChart3,
  BookOpen,
  Clock,
  Download,
  Eye,
  Shuffle,
  Sparkles,
  Timer as TimerIcon,
  Upload,
} from "lucide-react";
import {
  Line,
  LineChart as ReLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { CubeSimulator } from "./components/CubeSimulator";
import { MiniTwisty } from "./components/MiniTwisty";
import {
  pllCases,
  pllGroups,
  type PLLCase,
  type PLLGroup,
} from "./lib/caseLibrary";
import { useProficiencyStore, levelLabel } from "./lib/proficiencyStore";
import { useAlgPreferenceStore } from "./lib/algPreferenceStore";
import {
  chooseRandomCase,
  filterCasesForPractice,
  type PracticeMode,
} from "./lib/practiceEngine";
import {
  TIMING_STORAGE_KEY,
  computeStats,
  filterSolves,
  formatTime,
  type SolveRecord,
  buildExportPayload,
  parseExportPayload,
} from "./lib/timingEngine";
import { parse, isIdentity, applyToCase } from "./lib/algEngine";
import { useLocalStorageState } from "./hooks/useLocalStorage";

type PageKey = "train" | "library" | "custom" | "stats";

type TrainMode = "recognition" | "timing";

interface TrainingSettings {
  enabledGroups: PLLGroup[];
  practiceMode: PracticeMode;
  excludedCaseIds: string[];
}

const SETTINGS_KEY = "CFOP_PLL_SETTINGS_V1";

interface CustomAlgEntry {
  id: string;
  name: string;
  alg: string;
  caseId?: string;
  createdAt: number;
}

const CUSTOM_ALG_KEY = "CFOP_PLL_CUSTOM_ALGS_V1";

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function useTrainingSettings(): [TrainingSettings, (next: TrainingSettings) => void] {
  const [settings, setSettings] = useLocalStorageState<TrainingSettings>(
    SETTINGS_KEY,
    {
      enabledGroups: ["EPLL", "CPLL", "Mixed"],
      practiceMode: "weighted",
      excludedCaseIds: [],
    },
  );

  return [settings, setSettings];
}

function useSolveStore() {
  const [solves, setSolves] = useLocalStorageState<SolveRecord[]>(
    TIMING_STORAGE_KEY,
    [],
  );
  return { solves, setSolves };
}

function useCustomAlgStore() {
  const [entries, setEntries] = useLocalStorageState<CustomAlgEntry[]>(
    CUSTOM_ALG_KEY,
    [],
  );
  return { entries, setEntries };
}

function App() {
  const [page, setPage] = useState<PageKey>("train");
  const [trainMode, setTrainMode] = useState<TrainMode>("recognition");

  const [settings, setSettings] = useTrainingSettings();
  const proficiencyStore = useProficiencyStore();
  const { solves, setSolves } = useSolveStore();
  const customAlgStore = useCustomAlgStore();
  const algPreferenceStore = useAlgPreferenceStore();

  const enabledCases = useMemo(
    () =>
      filterCasesForPractice(pllCases, {
        enabledGroups: settings.enabledGroups,
        excludedCaseIds: settings.excludedCaseIds,
        mode: settings.practiceMode,
      }),
    [settings.enabledGroups, settings.excludedCaseIds, settings.practiceMode],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              CFOP PLL 训练器
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              3D 魔方 + 算法引擎 + 计时统计，一站式训练 21 个 PLL 案例。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50">
              极速上手：选好分组 → 识别图案 → 切到计时练习
            </Badge>
          </div>
        </header>

        <nav className="flex items-center justify-between gap-4">
          <Tabs
            value={page}
            onValueChange={(val) => setPage(val as PageKey)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="train" className="flex items-center gap-2">
                <TimerIcon className="h-4 w-4" /> 训练
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> 算法库
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> 自定义算法
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> 统计与设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="train" className="mt-4">
              <TrainingView
                mode={trainMode}
                onModeChange={setTrainMode}
                settings={settings}
                setSettings={setSettings}
                proficiency={proficiencyStore}
                solves={solves}
                setSolves={setSolves}
                enabledCases={enabledCases}
                algPreference={algPreferenceStore}
              />
            </TabsContent>

            <TabsContent value="library" className="mt-4">
              <LibraryView
                settings={settings}
                setSettings={setSettings}
                proficiency={proficiencyStore}
                customStore={customAlgStore}
                algPreference={algPreferenceStore}
              />
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <CustomAlgView
                customStore={customAlgStore}
                cases={pllCases}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
              <StatsView
                solves={solves}
                settings={settings}
                setSettings={setSettings}
                proficiency={proficiencyStore}
                customStore={customAlgStore}
              />
            </TabsContent>
          </Tabs>
        </nav>
      </div>
    </div>
  );
}

interface TrainingViewProps {
  mode: TrainMode;
  onModeChange: (mode: TrainMode) => void;
  settings: TrainingSettings;
  setSettings: (next: TrainingSettings) => void;
  proficiency: ReturnType<typeof useProficiencyStore>;
  solves: SolveRecord[];
  setSolves: (updater: (prev: SolveRecord[]) => SolveRecord[]) => void;
  enabledCases: PLLCase[];
  algPreference: ReturnType<typeof useAlgPreferenceStore>;
}

function TrainingView(props: TrainingViewProps) {
  const {
    mode,
    onModeChange,
    settings,
    setSettings,
    proficiency,
    solves,
    setSolves,
    enabledCases,
    algPreference,
  } = props;

  const [currentCase, setCurrentCase] = useState<PLLCase | null>(
    enabledCases[0] ?? pllCases[0] ?? null,
  );

  useEffect(() => {
    if (!currentCase && enabledCases.length) {
      setCurrentCase(enabledCases[0]);
    }
  }, [currentCase, enabledCases]);

  const pickNextCase = () => {
    if (!enabledCases.length) return;
    const next = chooseRandomCase(
      enabledCases,
      proficiency.map,
      settings.practiceMode,
    );
    if (next) setCurrentCase(next);
  };

  useEffect(() => {
    // 当分组或排除列表变化时，尝试切换到仍然可用的案例
    if (!currentCase) return;
    const stillEnabled = enabledCases.find((c) => c.id === currentCase.id);
    if (!stillEnabled && enabledCases.length) {
      setCurrentCase(enabledCases[0]);
    }
  }, [enabledCases, currentCase]);

  const groupCounts = useMemo(() => {
    const counts: Record<PLLGroup, number> = {
      EPLL: 0,
      CPLL: 0,
      Mixed: 0,
    };
    for (const c of pllCases) {
      counts[c.group] = (counts[c.group] ?? 0) + 1;
    }
    return counts;
  }, []);

  const primaryAlg =
    currentCase && currentCase.defaultAlgs[0]
      ? algPreference.getPrimary(currentCase.id, currentCase.defaultAlgs[0])
      : undefined;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 space-y-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TimerIcon className="h-4 w-4" />
                训练模式
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Button
                size="sm"
                variant={mode === "recognition" ? "default" : "outline"}
                onClick={() => onModeChange("recognition")}
              >
                <Eye className="mr-1 h-3 w-3" /> 识别
              </Button>
              <Button
                size="sm"
                variant={mode === "timing" ? "default" : "outline"}
                onClick={() => onModeChange("timing")}
              >
                <Clock className="mr-1 h-3 w-3" /> 计时
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">分组：</span>
              {pllGroups.map((g) => {
                const active = settings.enabledGroups.includes(g.id);
                return (
                  <Button
                    key={g.id}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => {
                      const exists = settings.enabledGroups.includes(g.id);
                      const nextGroups = exists
                        ? settings.enabledGroups.filter((x) => x !== g.id)
                        : [...settings.enabledGroups, g.id];
                      setSettings({ ...settings, enabledGroups: nextGroups });
                    }}
                  >
                    {g.label}
                    <Badge
                      variant="outline"
                      className="ml-1 h-5 px-1 text-[10px] leading-none"
                    >
                      {groupCounts[g.id] ?? 0}
                    </Badge>
                  </Button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">出题策略：</span>
              <Button
                size="sm"
                variant={settings.practiceMode === "balanced" ? "default" : "outline"}
                onClick={() =>
                  setSettings({ ...settings, practiceMode: "balanced" })
                }
              >
                均匀轮训
              </Button>
              <Button
                size="sm"
                variant={settings.practiceMode === "weighted" ? "default" : "outline"}
                onClick={() =>
                  setSettings({ ...settings, practiceMode: "weighted" })
                }
              >
                弱项加权
              </Button>
              <span className="text-slate-400">
                （生疏案例权重更高）
              </span>
            </div>
          </CardContent>
        </Card>

        {mode === "recognition" && (
          <RecognitionPanel
            currentCase={currentCase}
            setCurrentCase={setCurrentCase}
            pickNextCase={pickNextCase}
            algPreference={algPreference}
          />
        )}

        {mode === "timing" && (
          <TimingPanel
            currentCase={currentCase}
            pickNextCase={pickNextCase}
            solves={solves}
            setSolves={setSolves}
            algPreference={algPreference}
          />
        )}
      </div>

      <div className="w-full lg:w-[320px]">
        <CubeSimulator
          setupAlg={currentCase?.setupAlg}
          alg={primaryAlg}
          showControls
          patternOnly={mode === "recognition"}
        />
      </div>
    </div>
  );
}

interface RecognitionPanelProps {
  currentCase: PLLCase | null;
  setCurrentCase: (c: PLLCase | null) => void;
  pickNextCase: () => void;
  algPreference: ReturnType<typeof useAlgPreferenceStore>;
}

function RecognitionPanel(props: RecognitionPanelProps) {
  const { currentCase, setCurrentCase, pickNextCase, algPreference } = props;
  useEffect(() => {
    // 保持引用以避免编译器提示未使用参数
    void setCurrentCase;
  }, [setCurrentCase]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">(
    "none",
  );

  useEffect(() => {
    setSelectedId(undefined);
    setFeedback("none");
  }, [currentCase?.id]);

  const handleSelect = (caseId: string) => {
    setSelectedId(caseId);
    if (!currentCase) return;
    if (caseId === currentCase.id) {
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
  };

  const caseForSelect = pllCases;
  const selectedCase = selectedId
    ? caseForSelect.find((c) => c.id === selectedId) ?? null
    : null;

  const primaryAlg = currentCase
    ? algPreference.getPrimary(currentCase.id, currentCase.defaultAlgs[0])
    : undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4" /> 识别模式
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-slate-600">
          随机给出一个 PLL 图案，先在心中判断案例名称，再在下拉框中选择。
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Label className="mb-1 block text-xs text-slate-500">
              选择你认为的案例
            </Label>
            <Select
              value={selectedId}
              onValueChange={handleSelect}
              disabled={!currentCase}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="从 21 个 PLL 中选择" />
              </SelectTrigger>
              <SelectContent className="max-h-80 text-xs">
                {pllGroups.map((g) => (
                  <div key={g.id}>
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
                      {g.label}
                    </div>
                    {caseForSelect
                      .filter((c) => c.group === g.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.id} — {c.name}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-2 sm:pt-6">
            <Button size="sm" variant="outline" onClick={pickNextCase}>
              <Shuffle className="mr-1 h-3 w-3" /> 下一题
            </Button>
          </div>
        </div>

        {currentCase && selectedId && feedback !== "none" && (
          <div className="mt-2 grid gap-2 rounded border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600 sm:grid-cols-[2fr,1fr]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">你的选择：</span>
                {selectedCase ? (
                  <>
                    <Badge variant="outline">{selectedCase.id}</Badge>
                    <span>{selectedCase.name}</span>
                  </>
                ) : (
                  <span className="text-slate-400">未知案例（数据已变更）。</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-start sm:justify-end">
              {feedback === "correct" ? (
                <span className="text-emerald-600">识别正确！</span>
              ) : (
                <span className="text-rose-600">
                  识别错误，多观察图案特征再试一次。
                </span>
              )}
            </div>
          </div>
        )}

        {currentCase && (
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <div>
              <span className="font-medium">识别要点：</span>
              <span>{currentCase.recognitionHint}</span>
            </div>
            <div>
              <span className="font-medium">当前主力算法：</span>
              <span className="font-mono text-[11px]">
                {primaryAlg}
              </span>
            </div>
            {currentCase.altAlgs?.[0] && (
              <div>
                <span className="font-medium">备选算法：</span>
                <span className="font-mono text-[11px]">
                  {currentCase.altAlgs[0]}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TimingPanelProps {
  currentCase: PLLCase | null;
  pickNextCase: () => void;
  solves: SolveRecord[];
  setSolves: (updater: (prev: SolveRecord[]) => SolveRecord[]) => void;
  algPreference: ReturnType<typeof useAlgPreferenceStore>;
}

function TimingPanel(props: TimingPanelProps) {
  const { currentCase, pickNextCase, solves, setSolves, algPreference } = props;
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [displayMs, setDisplayMs] = useState(0);
  const [lastId, setLastId] = useState<string | null>(null);

  const primaryAlg = currentCase
    ? algPreference.getPrimary(currentCase.id, currentCase.defaultAlgs[0])
    : undefined;

  useEffect(() => {
    let raf: number | null = null;
    const tick = () => {
      if (!isRunning || startTime == null) return;
      const now = performance.now();
      setDisplayMs(now - startTime);
      raf = requestAnimationFrame(tick);
    };
    if (isRunning && startTime != null) {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [isRunning, startTime]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggleTimer();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const toggleTimer = () => {
    if (!currentCase) return;
    if (!isRunning) {
      setIsRunning(true);
      setDisplayMs(0);
      setStartTime(performance.now());
      return;
    }
    if (startTime == null) return;
    const end = performance.now();
    const elapsed = end - startTime;
    setIsRunning(false);
    setStartTime(null);
    setDisplayMs(elapsed);

    const record: SolveRecord = {
      id: generateId(),
      caseId: currentCase.id,
      group: currentCase.group,
      timeMs: elapsed,
      penalty: "OK",
      timestamp: Date.now(),
    };
    setSolves((prev) => [...prev, record]);
    setLastId(record.id);
    pickNextCase();
  };

  const caseSolves = useMemo(
    () =>
      currentCase
        ? filterSolves(solves, { caseId: currentCase.id })
        : ([] as SolveRecord[]),
    [currentCase, solves],
  );

  const stats = useMemo(() => computeStats(caseSolves), [caseSolves]);

  const updatePenalty = (id: string, penalty: "OK" | "+2" | "DNF") => {
    setSolves((prev) =>
      prev.map((s) => (s.id === id ? { ...s, penalty } : s)),
    );
  };

  const lastRecord = solves.find((s) => s.id === lastId) ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" /> 计时模式
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>空格键开始 / 停止计时，建议真实拿一颗魔方同步练习。</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">本次用时</div>
            <div className="font-mono text-3xl">
              {formatTime(displayMs)}
            </div>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <div>
              Ao5：<span className="font-semibold">{formatTime(stats.ao5)}</span>
            </div>
            <div>
              Ao12：<span className="font-semibold">{formatTime(stats.ao12)}</span>
            </div>
            <div>
              PB：<span className="font-semibold">{formatTime(stats.pb)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button size="sm" onClick={toggleTimer} disabled={!currentCase}>
              <TimerIcon className="mr-1 h-4 w-4" />
              {isRunning ? "停止（空格）" : "开始（空格）"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={pickNextCase}
              disabled={!currentCase}
            >
              <Shuffle className="mr-1 h-3 w-3" /> 下一案例
            </Button>
          </div>
        </div>

        {currentCase && (
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            <div>
              <span className="font-medium">当前主力算法：</span>
              <span className="font-mono text-[11px]">
                {primaryAlg}
              </span>
            </div>
          </div>
        )}

        {lastRecord && (
          <div className="mt-2 rounded border bg-slate-50 p-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                上一次：
                <span className="font-mono">
                  {formatTime(lastRecord.timeMs)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>判定：</span>
                <Button
                  size="sm"
                  variant={lastRecord.penalty === "OK" ? "default" : "outline"}
                  onClick={() => updatePenalty(lastRecord.id, "OK")}
                >
                  正常
                </Button>
                <Button
                  size="sm"
                  variant={lastRecord.penalty === "+2" ? "default" : "outline"}
                  onClick={() => updatePenalty(lastRecord.id, "+2")}
                >
                  +2
                </Button>
                <Button
                  size="sm"
                  variant={lastRecord.penalty === "DNF" ? "default" : "outline"}
                  onClick={() => updatePenalty(lastRecord.id, "DNF")}
                >
                  DNF
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-slate-500">
          最近 10 次该案例用时：
        </div>
        <ScrollArea className="mt-1 max-h-40 rounded border bg-white">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-2 py-1 text-left font-normal">#</th>
                <th className="px-2 py-1 text-left font-normal">时间</th>
                <th className="px-2 py-1 text-left font-normal">判定</th>
              </tr>
            </thead>
            <tbody>
              {caseSolves
                .slice(-10)
                .map((s, idx, arr) => ({ s, idx: arr.length - idx }))
                .map(({ s, idx }) => (
                  <tr key={s.id} className="odd:bg-white even:bg-slate-50/60">
                    <td className="px-2 py-1">{idx}</td>
                    <td className="px-2 py-1 font-mono">
                      {formatTime(s.timeMs)}
                    </td>
                    <td className="px-2 py-1">
                      {s.penalty === "OK" && "正常"}
                      {s.penalty === "+2" && "+2"}
                      {s.penalty === "DNF" && "DNF"}
                    </td>
                  </tr>
                ))}
              {caseSolves.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-2 py-3 text-center text-slate-400"
                  >
                    暂无该案例的计时记录。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface LibraryViewProps {
  settings: TrainingSettings;
  setSettings: (next: TrainingSettings) => void;
  proficiency: ReturnType<typeof useProficiencyStore>;
  customStore: ReturnType<typeof useCustomAlgStore>;
  algPreference: ReturnType<typeof useAlgPreferenceStore>;
}

function LibraryView(props: LibraryViewProps) {
  const { settings, setSettings, proficiency, customStore, algPreference } = props;
  const { entries, setEntries } = customStore;

  const [newAlgMap, setNewAlgMap] = useState<Record<string, string>>({});
  const [newAlgErrorMap, setNewAlgErrorMap] = useState<
    Record<string, string | undefined>
  >({});

  const toggleExclude = (id: string) => {
    const exists = settings.excludedCaseIds.includes(id);
    const next = exists
      ? settings.excludedCaseIds.filter((x) => x !== id)
      : [...settings.excludedCaseIds, id];
    setSettings({ ...settings, excludedCaseIds: next });
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" /> PLL 算法库
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p>
            这里汇总了 21 个 PLL 案例的常见算法，主要参考 Jperm、Cubeskills
            与 Speedsolving Wiki。你可以按案例查看推荐算法、备选算法以及识别提示，
            也可以标记“暂不练习”以在随机出题时排除。
          </p>
        </CardContent>
      </Card>

      <ScrollArea className="h-[480px] rounded border bg-white p-3">
        <div className="grid gap-3 md:grid-cols-2">
          {pllCases.map((c) => {
            const level = proficiency.map[c.id] ?? 1;
            const excluded = settings.excludedCaseIds.includes(c.id);
            const caseCustomAlgs = entries.filter((e) => e.caseId === c.id);
            const primaryAlg = algPreference.getPrimary(c.id, c.defaultAlgs[0]);
            const algItems = [
              {
                key: "default-0",
                source: "default" as const,
                alg: c.defaultAlgs[0],
              },
              ...(c.altAlgs?.map((alg, idx) => ({
                key: `alt-${idx}`,
                source: "alt" as const,
                alg,
              })) ?? []),
              ...caseCustomAlgs.map((e) => ({
                key: `custom-${e.id}`,
                source: "custom" as const,
                alg: e.alg,
                entryId: e.id,
              })),
            ];
            const sortedAlgItems = algItems.slice().sort((a, b) => {
              if (a.alg === primaryAlg && b.alg !== primaryAlg) return -1;
              if (b.alg === primaryAlg && a.alg !== primaryAlg) return 1;
              return 0;
            });
            const newAlgInput = newAlgMap[c.id] ?? "";
            const newAlgError = newAlgErrorMap[c.id];

            return (
              <Card
                key={c.id}
                className={
                  "flex flex-col gap-2 p-3 text-xs" +
                  (excluded ? " opacity-60" : "")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.id}</Badge>
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {pllGroups.find((g) => g.id === c.group)?.label ?? c.group}
                  </Badge>
                </div>
                <div className="text-slate-600">
                  <span className="font-medium">识别：</span>
                  <span>{c.recognitionHint}</span>
                </div>

                <div className="mt-1 space-y-2">
                  {sortedAlgItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2 rounded border border-slate-100 bg-slate-50 p-1.5"
                    >
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Badge
                            variant="outline"
                            className="border-sky-200 bg-sky-50 text-[10px]"
                          >
                            {item.source === "default"
                              ? "默认"
                              : item.source === "alt"
                              ? "备选"
                              : "自定义"}
                          </Badge>
                          {item.alg === primaryAlg && (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                            >
                              当前主力
                            </Badge>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-800 break-words">
                          {item.alg}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <MiniTwisty setupAlg={c.setupAlg} alg={item.alg} size={100} />
                        <div className="flex gap-1">
                          {item.alg !== primaryAlg && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => algPreference.setPrimary(c.id, item.alg)}
                            >
                              设为主力
                            </Button>
                          )}
                          {item.source === "custom" && item.entryId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px]"
                              onClick={() =>
                                setEntries((prev) =>
                                  prev.filter((e) => e.id !== item.entryId),
                                )
                              }
                            >
                              删除
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">添加自定义算法（最多 5 条）</span>
                    <span className="text-slate-400">
                      已有 {caseCustomAlgs.length} 条
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Textarea
                      rows={2}
                      value={newAlgInput}
                      onChange={(e) =>
                        setNewAlgMap((prev) => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                      className="font-mono text-[11px]"
                      placeholder="输入你的手法，支持 WCA / SiGN 记法，步骤之间请用空格分隔"
                    />
                    <p className="text-[11px] text-slate-500">
                      支持 WCA 与 SiGN 记法（例如 R U R'、M2、r、x、y 等），可以使用括号标注一组手法（如 (R U R') U2）以及重复记号如 [algo]xN 或 "(algo)2"；
                      部分高级写法是否能成功解析取决于 cubing.js（cubing/alg） 的实际支持情况，如解析失败请根据报错调整。
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          const value = (newAlgMap[c.id] ?? "").trim();
                          if (!value) {
                            setNewAlgErrorMap((prev) => ({
                              ...prev,
                              [c.id]: "请输入算法字符串。",
                            }));
                            return;
                          }
                          if (caseCustomAlgs.length >= 5) {
                            setNewAlgErrorMap((prev) => ({
                              ...prev,
                              [c.id]: "每个案例最多保存 5 条自定义算法，可删除后再添加。",
                            }));
                            return;
                          }
                          try {
                            parse(value);
                            setEntries((prev) => [
                              ...prev,
                              {
                                id: generateId(),
                                name: `${c.id} 自定义算法 ${
                                  caseCustomAlgs.length + 1
                                }`,
                                alg: value,
                                caseId: c.id,
                                createdAt: Date.now(),
                              },
                            ]);
                            setNewAlgMap((prev) => ({ ...prev, [c.id]: "" }));
                            setNewAlgErrorMap((prev) => ({ ...prev, [c.id]: "" }));
                          } catch (e: any) {
                            setNewAlgErrorMap((prev) => ({
                              ...prev,
                              [c.id]:
                                e?.message ??
                                "算法解析失败，请检查记号与空格是否正确。",
                            }));
                          }
                        }}
                      >
                        新增
                      </Button>
                      {newAlgError && (
                        <span className="text-rose-600">{newAlgError}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>熟练度：</span>
                    {[1, 2, 3].map((lv) => (
                      <Button
                        key={lv}
                        size="sm"
                        variant={level === lv ? "default" : "outline"}
                        onClick={() =>
                          proficiency.setLevelForCase(c.id, lv as 1 | 2 | 3)
                        }
                      >
                        {levelLabel(lv as 1 | 2 | 3)}
                      </Button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant={excluded ? "outline" : "ghost"}
                    onClick={() => toggleExclude(c.id)}
                  >
                    {excluded ? "重新加入训练" : "暂不练习"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

interface CustomAlgViewProps {
  customStore: ReturnType<typeof useCustomAlgStore>;
  cases: PLLCase[];
}

function CustomAlgView(props: CustomAlgViewProps) {
  const { customStore, cases } = props;
  const { entries, setEntries } = customStore;

  const [algInput, setAlgInput] = useState("R U R' U' R' F R2 U' R' U' R U R' F'");
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>();
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedSteps, setParsedSteps] = useState<string[]>([]);
  const [identityResult, setIdentityResult] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<string>("");

  const currentCase = cases.find((c) => c.id === selectedCaseId) ?? null;

  const handleParse = () => {
    try {
      const parsed = parse(algInput);
      setParsedSteps(parsed.steps);
      const idRes = isIdentity(algInput);
      if (idRes.isIdentity) {
        setIdentityResult("从复原态执行后仍然是复原（群论身份元）。");
      } else {
        setIdentityResult(
          `简化后仍有 ${idRes.remainingMoves} 步：${idRes.simplified}`,
        );
      }
      setParseError(null);
    } catch (e: any) {
      setParseError(e?.message ?? "解析失败，请检查记号是否正确。");
      setParsedSteps([]);
      setIdentityResult("");
    }
  };

  const handleVerify = () => {
    if (!currentCase) {
      setVerifyResult("请先选择一个 PLL 案例用于验证。");
      return;
    }
    try {
      const result = applyToCase(algInput, { setupAlg: currentCase.setupAlg });
      if (result.isIdentity) {
        setVerifyResult("从该 PLL 图案执行后可以完整还原魔方（忽略 AUF）。");
      } else {
        setVerifyResult(
          `未完全还原：简化后仍有 ${result.remainingMoves} 步，可视为误差。示例简化结果：${result.simplified}`,
        );
      }
    } catch (e: any) {
      setVerifyResult(e?.message ?? "验证过程中解析失败。");
    }
  };

  const handleSave = () => {
    const entry: CustomAlgEntry = {
      id: generateId(),
      name: `自定义算法 ${entries.length + 1}`,
      alg: algInput.trim(),
      caseId: selectedCaseId,
      createdAt: Date.now(),
    };
    setEntries((prev) => [...prev, entry]);
  };

  const stepsForPlayer = parsedSteps.length ? parsedSteps : undefined;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" /> 自定义算法解析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">
                输入算法字符串（支持 WCA / SiGN 记法）
              </Label>
              <Textarea
                rows={3}
                value={algInput}
                onChange={(e) => setAlgInput(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500">
                支持 WCA 与 SiGN 记法（例如 R U R'、M2、r、x、y 等），任意连续步骤之间请使用空格分隔；
                可以使用括号标注一组手法（如 (R U R') U2），也可以尝试重复记号如 [algo]xN 或 "(algo)2"。
                部分高级写法的解析能力依赖 cubing.js（cubing/alg） 的实际支持情况，如遇解析失败请以错误提示为准。
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Button size="sm" variant="outline" onClick={handleParse}>
                  解析并展示步骤
                </Button>
                <span>示例：R U R' U' R' F R2 U' R' U' R U R' F'</span>
              </div>
              {parseError && (
                <div className="text-xs text-rose-600">{parseError}</div>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-medium">逐步动作：</div>
              {parsedSteps.length ? (
                <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                  {parsedSteps.map((s, idx) => (
                    <span
                      key={`${s}-${idx}`}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400">
                  暂无解析结果，点击“解析并展示步骤”后将显示每一步动作。
                </div>
              )}
              {identityResult && (
                <div className="mt-1 text-emerald-700">{identityResult}</div>
              )}
            </div>

            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <Label className="text-xs text-slate-600">
                可选：选择一个 PLL 案例，验证从该图案出发是否能还原
              </Label>
              <Select
                value={selectedCaseId}
                onValueChange={setSelectedCaseId}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="选择关联的 PLL 案例（可选）" />
                </SelectTrigger>
                <SelectContent className="max-h-72 text-xs">
                  {pllGroups.map((g) => (
                    <div key={g.id}>
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
                        {g.label}
                      </div>
                      {cases
                        .filter((c) => c.group === g.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.id} — {c.name}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={handleVerify}>
                  验证是否可还原
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                >
                  收藏到本地
                </Button>
              </div>
              {verifyResult && (
                <div className="mt-1 text-xs text-slate-700">{verifyResult}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">已收藏的自定义算法</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600">
            {entries.length === 0 && (
              <div className="text-slate-400">
                暂无自定义算法，点击上方“收藏到本地”即可保存。
              </div>
            )}
            {entries.length > 0 && (
              <ScrollArea className="max-h-60 rounded border bg-white p-2">
                <div className="space-y-2">
                  {entries
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start justify-between gap-2 rounded border border-slate-100 bg-slate-50 p-2"
                      >
                        <div>
                          <div className="flex items-center gap-2 text-[11px] font-semibold">
                            {e.name}
                            {e.caseId && (
                              <Badge variant="outline" className="text-[10px]">
                                {e.caseId}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 font-mono text-[11px]">
                            {e.alg}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEntries((prev) =>
                              prev.filter((item) => item.id !== e.id),
                            )
                          }
                        >
                          删除
                        </Button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-[320px]">
        <CubeSimulator
          setupAlg={currentCase?.setupAlg}
          alg={algInput}
          stepsOverride={stepsForPlayer}
          showControls
          patternOnly={false}
        />
      </div>
    </div>
  );
}

interface StatsViewProps {
  solves: SolveRecord[];
  settings: TrainingSettings;
  setSettings: (next: TrainingSettings) => void;
  proficiency: ReturnType<typeof useProficiencyStore>;
  customStore: ReturnType<typeof useCustomAlgStore>;
}

function StatsView(props: StatsViewProps) {
  const { solves, settings, setSettings, proficiency, customStore } = props;
  const { entries } = customStore;

  const [filterCaseId, setFilterCaseId] = useState<string | "all">("all");
  const [filterGroup, setFilterGroup] = useState<PLLGroup | "all">("all");

  const filteredSolves = useMemo(() => {
    let list = solves;
    if (filterCaseId !== "all") {
      list = list.filter((s) => s.caseId === filterCaseId);
    }
    if (filterGroup !== "all") {
      list = list.filter((s) => s.group === filterGroup);
    }
    return list;
  }, [solves, filterCaseId, filterGroup]);

  const stats = useMemo(() => computeStats(filteredSolves), [filteredSolves]);

  const chartData = useMemo(
    () =>
      filteredSolves
        .slice(-30)
        .map((s, idx, arr) => ({
          index: arr.length - idx,
          time: s.timeMs / 1000,
        }))
        .reverse(),
    [filteredSolves],
  );

  const handleExport = () => {
    const payload = buildExportPayload(solves);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cfop-pll-trainer-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const importedSolves = parseExportPayload(text);
      setSettings({ ...settings });
      // 合并导入记录
      const existingIds = new Set(solves.map((s) => s.id));
      const merged = [
        ...solves,
        ...importedSolves.filter((s) => !existingIds.has(s.id)),
      ];
      window.localStorage.setItem(
        TIMING_STORAGE_KEY,
        JSON.stringify(merged),
      );
      // 触发状态刷新
      (window.location && window.location.reload?.()) ?? undefined;
    } catch (e) {
      // 简单地用 alert 提示导入失败
      alert("导入失败，请确认 JSON 内容格式正确。");
    }
  };

  const profSummary = useMemo(
    () => {
      const level1 = pllCases.filter(
        (c) => (proficiency.map[c.id] ?? 1) === 1,
      ).length;
      const level2 = pllCases.filter(
        (c) => (proficiency.map[c.id] ?? 1) === 2,
      ).length;
      const level3 = pllCases.filter(
        (c) => (proficiency.map[c.id] ?? 1) === 3,
      ).length;
      return { level1, level2, level3 };
    },
    [proficiency.map],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" /> 计时统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Select
                value={filterGroup}
                onValueChange={(v) =>
                  setFilterGroup(v === "all" ? "all" : (v as PLLGroup))
                }
              >
                <SelectTrigger className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="按分组筛选" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">全部分组</SelectItem>
                  {pllGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterCaseId}
                onValueChange={(v) =>
                  setFilterCaseId(v === "all" ? "all" : (v as string))
                }
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue placeholder="按案例筛选" />
                </SelectTrigger>
                <SelectContent className="max-h-72 text-xs">
                  <SelectItem value="all">全部案例</SelectItem>
                  {pllCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-4">
              <div>
                <div className="text-slate-400">平均</div>
                <div className="font-mono text-lg">
                  {formatTime(stats.average)}
                </div>
              </div>
              <div>
                <div className="text-slate-400">中位数</div>
                <div className="font-mono text-lg">
                  {formatTime(stats.median)}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Ao5</div>
                <div className="font-mono text-lg">
                  {formatTime(stats.ao5)}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Ao12</div>
                <div className="font-mono text-lg">
                  {formatTime(stats.ao12)}
                </div>
              </div>
            </div>

            <div className="mt-2 h-52 rounded border bg-white">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="index"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      unit="s"
                    />
                    <Tooltip
                      formatter={(value: any) => `${value.toFixed(2)} s`}
                      labelFormatter={(label) => `第 ${label} 次`}
                    />
                    <Line
                      type="monotone"
                      dataKey="time"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 3 }}
                    />
                  </ReLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  计时数据不足，完成几次练习后即可看到趋势图。
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">熟练度概览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="space-y-1">
              <div>
                生疏：<span className="font-semibold">{profSummary.level1}</span>
              </div>
              <div>
                一般：<span className="font-semibold">{profSummary.level2}</span>
              </div>
              <div>
                熟练：<span className="font-semibold">{profSummary.level3}</span>
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="font-medium">配置与数据导入 / 导出</div>
              <p>
                当前版本将分组选择、熟练度、自定义算法与计时记录全部保存在浏览器
                localStorage 中。可以通过 JSON 文件导出到其他设备或进行备份。
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="mr-1 h-3 w-3" /> 导出 JSON
                </Button>
                <div className="relative inline-flex items-center text-xs">
                  <Input
                    type="file"
                    accept="application/json"
                    onChange={handleImport}
                    className="h-8 w-40 cursor-pointer border border-dashed border-slate-300 text-[11px] file:hidden"
                  />
                  <span className="pointer-events-none absolute left-2 flex items-center gap-1 text-[11px] text-slate-500">
                    <Upload className="h-3 w-3" /> 导入 JSON
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <div className="font-medium">自定义算法数量</div>
              <div>
                当前已保存 <span className="font-semibold">{entries.length}</span>{" "}
                条自定义算法。
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
