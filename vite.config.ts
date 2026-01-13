import { defineConfig } from 'vite';

export default defineConfig({
  // 替换为你的仓库名称，例如 '/vistia/'
  // 如果是个人主页 (username.github.io) 则设置为 '/'
  base: './', 
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  }
});