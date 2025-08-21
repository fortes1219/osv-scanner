import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { visualizer } from 'rollup-plugin-visualizer';

interface AssetsInfo {
  name: string
  source: string | Uint8Array
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tagName) => {
              return tagName === 'vue-advanced-chat' || tagName === 'emoji-picker';
            },
          },
        },
      }),
      Components({
        resolvers: [
          ElementPlusResolver({ importStyle: 'css' }),
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@/styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@/assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@/constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
        '@/composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
        '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@/plugin': fileURLToPath(new URL('./src/plugin', import.meta.url)),
      }
    }, server: {
      port: 8080,
      proxy: {
        '/api': {
          target: env.VITE_BASE_API,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
      }
    },
    build: {
      rollupOptions: {
        plugins: [
          visualizer({
            // 產生分析報告的檔名
            filename: 'dist/report.html',
            // 圖表模式，可使用 "treemap"、"sunburst"、"network" 等
            template: 'treemap',
            // 只在 build 時生成報告（設為 true 時，要在正式打包完才會生成檔案）
            emitFile: false,
            // 是否壓縮視覺化檔案
            gzipSize: true,
            // 開啟 brotli 尺寸計算
            brotliSize: true,
          }),
        ],
        output: {
          manualChunks(id) {
            if (id.includes('@element-plus/icons-vue')) {
              return 'element-plus-icons';
            }

            // 其餘 element-plus （排除 icons 部分）才切到 'element-plus'
            if (
              id.includes('node_modules') &&
              id.includes('element-plus') &&
              !id.includes('@element-plus/icons-vue')
            ) {
              return 'element-plus';
            }

            // 其他第三方套件歸到 vendor
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          chunkFileNames: "js/[name].[hash].js",
          entryFileNames: "js/[name].[hash].js",
          assetFileNames: (assetInfo) => {
            const asset = assetInfo as AssetsInfo;
            const info = asset.name.split('.');
            const extType = info[info.length - 1];
            if (/png|jpe?g|gif|svg|webp|ico/i.test(extType)) {
              return `img/[name]-[hash][extname]`;
            }
            if (/css/i.test(extType)) {
              return `css/[name]-[hash][extname]`;
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        }
      },
      minify: 'esbuild',  // 使用 esbuild 壓縮
    },
    esbuild: {
      //drop: ['console', 'debugger'],  // 移除 console 和 debugger
    },
    css: {
      devSourcemap: true,
    }
  };
});