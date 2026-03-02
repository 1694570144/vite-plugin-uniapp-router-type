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

      // 安全移除注释
      const jsonStr = content
        .replace(/\/\/.*/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

      const pagesJson = JSON.parse(jsonStr);
      const routes: string[] = [];

      // 提取主包路径
      if (Array.isArray(pagesJson.pages)) {
        pagesJson.pages.forEach((p: any) => {
          if (p.path) routes.push(`/${p.path}`);
        });
      }

      // 提取分包路径 (修复核心)
      if (Array.isArray(pagesJson.subPackages)) {
        pagesJson.subPackages.forEach((sub: any) => {
          const subRoot = sub.root;
          if (Array.isArray(sub.pages)) {
            sub.pages.forEach((p: any) => {
              if (p.path) {
                // 确保生成格式为 /root/path
                const fullPath = `/${subRoot}/${p.path}`.replace(/\/+/g, "/");
                routes.push(fullPath);
              }
            });
          }
        });
      }

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
      console.log(`✅ [Router Type] 已同步 ${routes.length} 条路由`);
    } catch (e) {
      // 捕获异常
    }
  };

  // 物理文件监听器
  if (fs.existsSync(fullPagesJsonPath)) {
    fs.watch(fullPagesJsonPath, (event) => {
      if (event === "change") generate();
    });
  }

  return {
    name: "vite-plugin-uniapp-router-type",
    configResolved: generate,
    configureServer(server) {
      server.watcher.add(fullPagesJsonPath);
    },
  };
}
