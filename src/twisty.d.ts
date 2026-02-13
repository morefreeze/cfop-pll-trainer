// 让 TS/JSX 认识 <twisty-player> Web Component
// 仅声明最常用属性，实际运行时由 cubing.js 提供实现。

import type React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "twisty-player": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        alg?: string;
        // 其他属性按需扩展
      };
    }
  }
}
