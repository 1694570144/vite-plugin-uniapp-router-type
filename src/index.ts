import { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

export interface UniappRouterTypeOptions {
  pagesJsonPath?: string;
  outputDir?: string;
  fileName?: string;
}

interface PageConfig {
  path: string;
}
interface SubPackageConfig {
  root: string;
  pages: PageConfig[];
}
interface PagesJson {
  pages?: PageConfig[];
  subPackages?: SubPackageConfig[];
}

export default function uniappRouterType(
  options: UniappRouterTypeOptions = {},
): Plugin {
  const {
    pagesJsonPath = "src/pages.json",
    outputDir = "src/types",
    fileName = "router.d.ts",
  } = options;

  const root = process.cwd();
  const fullPagesJsonPath = path.resolve(root, pagesJsonPath);
  const fullOutputDir = path.resolve(root, outputDir);
  const fullOutputPath = path.resolve(fullOutputDir, fileName);

  const generate = () => {
    try {
      if (!fs.existsSync(fullPagesJsonPath)) return;

      const content = fs.readFileSync(fullPagesJsonPath, "utf-8");
      // 增强 JSON 解析，处理可能的尾随逗号和注释
      const pagesJson: PagesJson = JSON.parse(
        content.replace(/\/\/.*/g, "").replace(/,(\s*[\}\]] baby)/g, "$1"),
      );
      const routes: string[] = [];

      pagesJson.pages?.forEach((p) => routes.push(`/${p.path}`));
      pagesJson.subPackages?.forEach((sub) => {
        sub.pages?.forEach((p) => routes.push(`/${sub.root}/${p.path}`));
      });

      if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true });
      }

      const routesType =
        routes.length > 0 ? `"${routes.join('" | "')}"` : "string";
      const template = `/** 由 vite-plugin-uniapp-router-type 自动生成 */
export type PagePath = ${routesType};
export type PageUrl = PagePath | \`\${PagePath}?\${string}\`;

declare global {
  type GlobalPagePath = PagePath;
  type GlobalPageUrl = PageUrl;

  interface Uni {
    navigateTo(options: UniApp.NavigateToOptions & { url: PageUrl }): void;
    redirectTo(options: UniApp.RedirectToOptions & { url: PageUrl }): void;
    reLaunch(options: UniApp.ReLaunchOptions & { url: PageUrl }): void;
    switchTab(options: UniApp.SwitchTabOptions & { url: PagePath }): void;
  }
}
`;
      // 只有内容变化时才写入，避免循环触发 HMR
      if (
        fs.existsSync(fullOutputPath) &&
        fs.readFileSync(fullOutputPath, "utf-8") === template
      ) {
        return;
      }

      fs.writeFileSync(fullOutputPath, template);
      console.log("✅ [Router Type] Generated successfully.");
    } catch (e) {
      console.error("❌ [Router Type] Generate failed:", e);
    }
  };

  return {
    name: "vite-plugin-uniapp-router-type",
    // 1. 启动时生成
    configResolved: generate,

    // 2. 核心：确保 Vite 监听到 pages.json 的变化
    configureServer(server) {
      server.watcher.add(fullPagesJsonPath);
      // 如果文件被删除后重新创建，也能捕捉到
      server.watcher.on("add", (file) => {
        if (file === fullPagesJsonPath) generate();
      });
    },

    // 3. 热更新处理
    handleHotUpdate({ file, server }) {
      if (file.replace(/\\/g, "/").endsWith(pagesJsonPath)) {
        generate();
        // 强制触发一次全局 HMR，让 IDE 重新扫描类型文件
        server.ws.send({ type: "full-reload" });
      }
    },
  };
}
