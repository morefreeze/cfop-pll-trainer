import { useEffect, useRef } from "react";

export interface MiniTwistyProps {
  /** 从复原态到题目图案的算法，一般为案例的 setupAlg */
  setupAlg?: string;
  /** 可选：用于从该图案出发演示的算法；为空字符串时仅展示打乱状态 */
  alg?: string;
  /** 可选：自定义尺寸，默认约 110 像素 */
  size?: number;
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

/**
 * 小型 3D 预览组件，仅用于展示某个 PLL 案例的图案状态或从该图案出发的演示。
 */
export function MiniTwisty(props: MiniTwistyProps) {
  const { setupAlg, alg = "", size = 110 } = props;

  useTwistyScript();

  const playerRef = useRef<HTMLElement | null>(null);

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

    const trimmedAlg = typeof alg === "string" ? alg.trim() : "";
    el.alg = trimmedAlg || undefined;
  }, [setupAlg, alg]);

  return (
    <div className="flex items-center justify-center">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <twisty-player
        ref={playerRef as any}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  );
}
