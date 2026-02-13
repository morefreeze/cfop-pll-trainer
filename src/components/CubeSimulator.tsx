import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";

export interface CubeSimulatorProps {
  /** 从复原态到题目图案的算法 */
  setupAlg?: string;
  /** 需要演示的解法算法（完整） */
  alg?: string;
  /** 预先拆好的步列表；若不传则根据 alg 拆分 */
  stepsOverride?: string[];
  /** 初始是否自动播放解法 */
  autoPlay?: boolean;
  /** 是否展示步进控制与速度调节 */
  showControls?: boolean;
  /** 是否默认只展示图案（不立即播放解法） */
  patternOnly?: boolean;
}

function useTwistyScript() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.querySelector("script[data-cubing-twisty]");
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://cdn.cubing.net/v0/js/cubing/twisty";
    script.type = "module";
    script.dataset.cubingTwisty = "true";
    document.head.appendChild(script);
  }, []);
}

export function CubeSimulator(props: CubeSimulatorProps) {
  const {
    setupAlg,
    alg,
    stepsOverride,
    autoPlay = false,
    showControls = true,
    patternOnly = false,
  } = props;

  useTwistyScript();

  const playerRef = useRef<HTMLElement | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(patternOnly ? -1 : 0);
  const [isPlaying, setIsPlaying] = useState(autoPlay && !patternOnly);
  const [showHints, setShowHints] = useState(true);
  const [speedMs, setSpeedMs] = useState(350); // 单步默认 350ms

  const steps = useMemo(() => {
    if (stepsOverride) return stepsOverride;
    if (!alg) return [];
    return alg.trim().length ? alg.trim().split(/\s+/) : [];
  }, [alg, stepsOverride]);

  const maxStepIndex = steps.length - 1;

  const fullAlg = useMemo(() => {
    if (!steps.length) return "";
    return steps.join(" ");
  }, [steps]);

  useEffect(() => {
    const el = playerRef.current as any;
    if (!el) return;

    const cleanedSetup = setupAlg?.trim();
    if (cleanedSetup) {
      el.experimentalSetupAlg = cleanedSetup;
      el.experimentalSetupAnchor = "end";
    } else {
      el.experimentalSetupAlg = undefined;
      el.experimentalSetupAnchor = undefined;
    }

    if (fullAlg && fullAlg.trim().length) {
      el.alg = fullAlg;
    } else {
      el.alg = undefined;
    }
  }, [setupAlg, fullAlg]);

  // 自动步进
  useEffect(() => {
    if (!isPlaying) return;
    if (!steps.length) return;
    if (stepIndex >= maxStepIndex) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, maxStepIndex));
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, stepIndex, maxStepIndex, speedMs, steps.length]);

  const canStepPrev = stepIndex >= 0;
  const canStepNext = stepIndex < maxStepIndex;

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(patternOnly ? -1 : 0);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setStepIndex((prev) => (prev <= -1 ? -1 : prev - 1));
  };

  const handleNext = () => {
    setStepIndex((prev) => (prev >= maxStepIndex ? maxStepIndex : prev + 1));
  };

  const currentStepLabel =
    stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : "(仅图案)";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="w-full flex justify-center">
        {/* eslint-disable-next-line react/no-unknown-property */}
        <twisty-player
          ref={playerRef as any}
          style={{ width: "260px", height: "260px" }}
        />
      </div>

      {showControls && (
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={!canStepPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={!canStepNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const el = playerRef.current as any;
                  setIsPlaying((v) => {
                    const next = !v;
                    if (!v && next) {
                      if (steps.length) {
                        setStepIndex((prev) => (prev < 0 ? 0 : prev));
                      }
                      if (el && typeof el.play === "function") {
                        try {
                          el.play();
                        } catch {
                          // ignore
                        }
                      }
                    } else if (v && !next) {
                      if (el && typeof el.pause === "function") {
                        try {
                          el.pause();
                        } catch {
                          // ignore
                        }
                      }
                    }
                    return next;
                  });
                }}
                disabled={!steps.length}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              当前步：<span className="font-mono">{currentStepLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              播放速度
            </div>
            <Slider
              className="flex-1"
              min={0}
              max={100}
              step={1}
              defaultValue={[50]}
              onValueChange={(values) => {
                const v = values[0] ?? 50;
                // 150ms ~ 800ms 之间映射
                const ms = 150 + ((100 - v) / 100) * 650;
                setSpeedMs(ms);
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              className="underline-offset-2 hover:underline"
              onClick={() => setShowHints((v) => !v)}
            >
              {showHints ? "隐藏手法指示" : "显示手法指示"}
            </button>
            <div className="font-mono text-right truncate max-w-[180px]">
              {fullAlg || "(无算法)"}
            </div>
          </div>

          {showHints && steps.length > 0 && (
            <div className="flex flex-wrap gap-1 text-[11px] leading-relaxed">
              {steps.map((s, idx) => (
                <span
                  key={`${s}-${idx}`}
                  className={
                    "px-1.5 py-0.5 rounded border border-border font-mono" +
                    (idx === stepIndex
                      ? " bg-primary text-primary-foreground"
                      : " bg-muted text-foreground")
                  }
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
