import { defineConfig } from 'vite';

export default defineConfig({
  // 使用自定义域名后，路径通常是根目录
  base: '/', 
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  },
  // 将环境变量注入到代码中
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});