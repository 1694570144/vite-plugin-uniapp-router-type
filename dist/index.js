"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => uniappRouterType
});
module.exports = __toCommonJS(index_exports);
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
function uniappRouterType(options = {}) {
  const {
    pagesJsonPath = "src/pages.json",
    outputDir = "src/types",
    fileName = "router.d.ts"
  } = options;
  const root = process.cwd();
  const fullPagesJsonPath = import_node_path.default.resolve(root, pagesJsonPath);
  const fullOutputDir = import_node_path.default.resolve(root, outputDir);
  const fullOutputPath = import_node_path.default.resolve(fullOutputDir, fileName);
  const generate = () => {
    try {
      if (!import_node_fs.default.existsSync(fullPagesJsonPath)) return;
      const content = import_node_fs.default.readFileSync(fullPagesJsonPath, "utf-8");
      const jsonStr = content.replace(/\/\/.*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
      const pagesJson = JSON.parse(jsonStr);
      const routes = [];
      pagesJson.pages?.forEach((p) => routes.push(`/${p.path}`));
      pagesJson.subPackages?.forEach((sub) => {
        sub.pages?.forEach((p) => routes.push(`/${sub.root}/${p.path}`));
      });
      if (!import_node_fs.default.existsSync(fullOutputDir)) {
        import_node_fs.default.mkdirSync(fullOutputDir, { recursive: true });
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
      if (import_node_fs.default.existsSync(fullOutputPath) && import_node_fs.default.readFileSync(fullOutputPath, "utf-8") === template) {
        return;
      }
      import_node_fs.default.writeFileSync(fullOutputPath, template);
      console.log("\u2705 [Router Type] \u8DEF\u7531\u7C7B\u578B\u5DF2\u81EA\u52A8\u540C\u6B65");
    } catch (e) {
    }
  };
  if (import_node_fs.default.existsSync(fullPagesJsonPath)) {
    import_node_fs.default.watch(fullPagesJsonPath, (eventType) => {
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
