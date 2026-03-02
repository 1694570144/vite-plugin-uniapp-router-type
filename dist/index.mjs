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
      const jsonStr = content.replace(/\/\/.*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
      const pagesJson = JSON.parse(jsonStr);
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
      console.log("\u2705 [Router Type] \u8DEF\u7531\u7C7B\u578B\u5DF2\u81EA\u52A8\u540C\u6B65");
    } catch (e) {
    }
  };
  if (fs.existsSync(fullPagesJsonPath)) {
    fs.watch(fullPagesJsonPath, (eventType) => {
      if (eventType === "change") {
        generate();
      }
    });
  }
  return {
    name: "vite-plugin-uniapp-router-type",
    configResolved: generate,
    // 确保启动时生成
    // 依然保留此配置，作为双重保险
    configureServer(server) {
      server.watcher.add(fullPagesJsonPath);
    }
  };
}
export {
  uniappRouterType as default
};
