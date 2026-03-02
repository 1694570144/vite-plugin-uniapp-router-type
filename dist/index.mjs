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
      const pagesJson = JSON.parse(content.replace(/\/\/.*/g, ""));
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
      console.log("\u2705 [Router Type] \u7C7B\u578B\u5B9A\u4E49\u5DF2\u5B9E\u65F6\u540C\u6B65");
    } catch (e) {
    }
  };
  return {
    name: "vite-plugin-uniapp-router-type",
    // 1. 启动时生成
    configResolved: generate,
    // 2. 针对 CLI 模式的底层监听
    configureServer(server) {
      server.watcher.add(fullPagesJsonPath);
      server.watcher.on("all", (event, filePath) => {
        if (path.resolve(filePath) === fullPagesJsonPath) {
          if (event === "change" || event === "add") {
            generate();
          }
        }
      });
    }
  };
}
export {
  uniappRouterType as default
};
