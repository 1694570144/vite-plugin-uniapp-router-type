import { Plugin } from 'vite';

interface UniappRouterTypeOptions {
    pagesJsonPath?: string;
    outputDir?: string;
    fileName?: string;
}
declare function uniappRouterType(options?: UniappRouterTypeOptions): Plugin;

export { type UniappRouterTypeOptions, uniappRouterType as default };
