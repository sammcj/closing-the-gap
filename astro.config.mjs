import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import remarkToc from 'remark-toc';

export default defineConfig({
  integrations: [
    tailwind(),
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: { theme: 'dracula' },
      remarkPlugins: [remarkToc],
      remarkRehype: { footnoteLabel: 'Footnotes' },
      gfm: false,
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['echarts']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            echarts: ['echarts']
          }
        }
      }
    }
  }
});
