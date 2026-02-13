# CFOP PLL 训练器

一个为魔方爱好者打造的在线 CFOP-PLL 训练工具，旨在提供从识别到计时的完整练习体验。项目基于现代前端技术栈构建，具有良好的交互性与扩展性。

## 主要功能

- **3D 魔方模拟**：基于 `cubing.js` 的 `TwistyPlayer` 实现，支持展示任意 PLL 案例的图案与解法动画。
- **算法库**：内置 21 个 PLL 案例，每个案例包含多种主流算法（来源 Jperm、Cubeskills、Speedsolving Wiki）、识别提示与分组信息。
- **训练模式**：
    - **识别模式**：随机展示一个 PLL 图案，供用户练习识别并即时获得反馈与讲解。
    - **计时模式**：对选定案例进行计时练习，自动记录成绩并进行统计。
- **自定义算法**：用户可以输入自己的算法，实时解析、播放动画，并验证其是否能从特定 PLL 案例还原魔方。
- **统计与分析**：
    - 自动计算 Ao5 (5 次平均)、Ao12 (12 次平均)、个人最佳 (PB) 等常用指标。
    - 提供最近练习的趋势图表。
- **数据持久化与迁移**：
    - 所有训练记录、熟练度标记、自定义算法均通过 localStorage 保存在本地。
    - 支持通过 JSON 文件导入/导出全部数据，方便在不同设备间同步。
- **熟练度标记**：用户可为每个案例标记熟练程度（生疏/一般/熟练），用于随机出题时的“弱项加权”。

## 技术栈与实现

- **框架**：React 18 + Vite
- **语言**：TypeScript
- **UI**：Tailwind CSS + shadcn/ui
- **3D 模拟与算法解析**：`cubing.js`
- **图表**：`recharts`
- **图标**：`lucide-react`
- **代码规范**：ESLint

## 本地开发与运行

项目使用 `pnpm` 作为包管理器。

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm run dev
   ```
   服务将在 `http://localhost:5173` 启动，并支持热模块替换。

3. **构建生产版本**
   ```bash
   pnpm run build
   ```
   构建产物将输出到 `dist` 目录。

## 模块化设计

项目遵循模块化原则，将核心逻辑拆分为多个独立的引擎与库，便于维护与未来扩展（如接入 OLL、F2L 训练）。

- **`algEngine.ts`**：封装 `cubing/alg`，提供算法字符串的解析、标准化、步数拆分、逆运算、群论等价性判断（判断是否还原）等核心功能。
- **`caseLibrary.ts`**：定义 PLL 案例的数据结构，预置 21 个案例的名称、分组、默认算法、识别提示等。同时预留了 OLL、F2L 的扩展结构。
- **`practiceEngine.ts`**：管理训练会话逻辑，包括根据用户选择的分组和熟练度进行“均匀轮训”或“弱项加权”的出题策略。
- **`timingEngine.ts`**：处理所有与计时相关的功能，包括计时器的实现、成绩记录、`+2`/`DNF` 标记，以及 Ao5/Ao12 等统计指标的计算。
- **`proficiencyStore.ts`**：使用 React Hook 和 localStorage 实现熟练度数据的持久化存储与管理。
- **`CubeSimulator.tsx`**：一个通用的 React 组件，封装了 `twisty-player` Web Component，提供了步进控制、速度调节、算法播放等交互功能。

## 预置算法来源

为确保算法的准确性与通用性，本项目预置的 PLL 算法主要参考自以下广受认可的资源：

- **Jperm.net**: [https://jperm.net/algs/pll](https://jperm.net/algs/pll)
- **Cubeskills (Feliks Zemdegs)**: [PLL Algorithms PDF](https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf)
- **Speedsolving.com Wiki**: [https://www.speedsolving.com/wiki/index.php/PLL](https://www.speedsolving.com/wiki/index.php/PLL)
