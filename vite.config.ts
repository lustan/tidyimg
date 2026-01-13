import { defineConfig } from 'vite';

export default defineConfig({
  // 这里的 base 必须对应你的 GitHub 仓库名
  base: '/PixKit/', 
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  }
});