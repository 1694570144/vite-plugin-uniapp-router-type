# vite-plugin-uniapp-router-type

[English](#english) | [简体中文](#简体中文)

---

<a name="简体中文"></a>

## 简体中文

这是一个专为 UniApp 开发设计的 Vite 插件，它会自动读取项目中的 `pages.json` 文件（包括主包和分包），并实时生成对应的 TypeScript 类型定义。

### ✨ 特性

- **全自动更新**: 实时监听 `pages.json` 的修改，保存即更新类型。
- **智能补全**: 为 `uni.navigateTo`, `uni.redirectTo`, `uni.reLaunch`, `uni.switchTab` 提供路径自动补全。
- **类型安全**: 支持带参数的 URL 类型检查 (`PageUrl`)。
- **灵活配置**: 可自定义输入输出路径。

### 📦 安装

由于该插件仅在开发阶段使用，请将其安装为 **开发依赖 (-D)**：

```bash
npm install vite-plugin-uniapp-router-type -D
# 或者使用 pnpm
pnpm add vite-plugin-uniapp-router-type -D
# 或者使用 yarn
yarn add vite-plugin-uniapp-router-type -D
```

## 使用方法
在 vite.config.ts 中引入并配置：
```bash
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import uniappRouterType from 'vite-plugin-uniapp-router-type';

export default defineConfig({
  plugins: [
    uni(),
    // 默认配置下，插件会读取 src/pages.json 并在 src/types/router.d.ts 生成类型
    uniappRouterType({
      // 可选配置 (默认值如下)
      // pagesJsonPath: 'src/pages.json',
      // outputDir: 'src/types',
      // fileName: 'router.d.ts'
    })
  ]
});
```