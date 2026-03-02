import { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

export interface UniappRouterTypeOptions {
  pagesJsonPath?: string;
  outputDir?: string;
  fileName?: string;
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
      // 简单移除注释并解析
      const pagesJson = JSON.parse(content.replace(/\/\/.*/g, ""));
      const routes: string[] = [];

      pagesJson.pages?.forEach((p: any) => routes.push(`/${p.path}`));
      pagesJson.subPackages?.forEach((sub: any) => {
        sub.pages?.forEach((p: any) => routes.push(`/${sub.root}/${p.path}`));
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

      // 只有内容真的变化了才写入
      if (
        fs.existsSync(fullOutputPath) &&
        fs.readFileSync(fullOutputPath, "utf-8") === template
      ) {
        return;
      }

      fs.writeFileSync(fullOutputPath, template);
      console.log("✅ [Router Type] 类型定义已实时同步");
    } catch (e) {
      // 避免 JSON 解析一半时的报错导致进程崩溃
    }
  };

  return {
    name: "vite-plugin-uniapp-router-type",

    // 1. 启动时生成
    configResolved: generate,

    // 2. 针对 CLI 模式的底层监听
    configureServer(server) {
      // 使用 Vite 内部集成的 chokidar 实例
      // 这样可以确保即使 UniApp 拦截了 HMR，底层文件系统的变化依然能被捕捉
      server.watcher.add(fullPagesJsonPath);

      server.watcher.on("all", (event, filePath) => {
        // 统一斜杠格式，匹配路径
        if (path.resolve(filePath) === fullPagesJsonPath) {
          if (event === "change" || event === "add") {
            generate();
          }
        }
      });
    },
  };
}
