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

      // 增强型正则：移除单行注释 // 和多行注释 /* */
      const jsonStr = content
        .replace(/\/\/.*/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

      const pagesJson = JSON.parse(jsonStr);
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

      if (
        fs.existsSync(fullOutputPath) &&
        fs.readFileSync(fullOutputPath, "utf-8") === template
      ) {
        return;
      }

      fs.writeFileSync(fullOutputPath, template);
      console.log("✅ [Router Type] 路由类型已自动同步");
    } catch (e) {
      // 解析中可能产生异常，忽略它以保证进程不挂掉
    }
  };

  // --- 关键修改：手动物理监听 ---
  // 使用 Node.js 原生的 watch，不依赖 Vite 的 server 生命周期
  if (fs.existsSync(fullPagesJsonPath)) {
    // 监听 pages.json 所在的文件系统事件
    fs.watch(fullPagesJsonPath, (eventType) => {
      if (eventType === "change") {
        generate();
      }
    });
  }

  return {
    name: "vite-plugin-uniapp-router-type",
    configResolved: generate, // 确保启动时生成
    // 依然保留此配置，作为双重保险
    configureServer(server) {
      server.watcher.add(fullPagesJsonPath);
    },
  };
}
