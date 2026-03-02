// src/index.ts
import fs from "fs";
import path from "path";
function uniappRouterType(options = {}) {
  const {
    pagesJsonPath = "src/pages.json",
    outputDir = "src/types",
    fileName = "router.d.ts"
  } = options;
  const root = process.cwd();
  const fullPagesJsonPath = path.resolve(root, pagesJsonPath);
  const fullOutputDir = path.resolve(root, outputDir);
  const fullOutputPath = path.resolve(fullOutputDir, fileName);
  const generate = () => {
    try {
      if (!fs.existsSync(fullPagesJsonPath)) return;
      const content = fs.readFileSync(fullPagesJsonPath, "utf-8");
      const pagesJson = JSON.parse(
        content.replace(/\/\/.*/g, "").replace(/,(\s*[\}\]] baby)/g, "$1")
      );
      const routes = [];
      pagesJson.pages?.forEach((p) => routes.push(`/${p.path}`));
      pagesJson.subPackages?.forEach((sub) => {
        sub.pages?.forEach((p) => routes.push(`/${sub.root}/${p.path}`));
      });
      if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true });
      }
      const routesType = routes.length > 0 ? `"${routes.join('" | "')}"` : "string";
      const template = `/** \u7531 vite-plugin-uniapp-router-type \u81EA\u52A8\u751F\u6210 */
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
      if (fs.existsSync(fullOutputPath) && fs.readFileSync(fullOutputPath, "utf-8") === template) {
        return;
      }
      fs.writeFileSync(fullOutputPath, template);
      console.log("\u2705 [Router Type] Generated successfully.");
    } catch (e) {
      console.error("\u274C [Router Type] Generate failed:", e);
    }
  };
  return {
    name: "vite-plugin-uniapp-router-type",
    // 1. 启动时生成
    configResolved: generate,
    // 2. 核心：确保 Vite 监听到 pages.json 的变化
    configureServer(server) {
      server.watcher.add(fullPagesJsonPath);
      server.watcher.on("add", (file) => {
        if (file === fullPagesJsonPath) generate();
      });
    },
    // 3. 热更新处理
    handleHotUpdate({ file, server }) {
      if (file.replace(/\\/g, "/").endsWith(pagesJsonPath)) {
        generate();
        server.ws.send({ type: "full-reload" });
      }
    }
  };
}
export {
  uniappRouterType as default
};
