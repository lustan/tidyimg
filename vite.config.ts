import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tidyimg/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  },
  // 将环境变量注入到代码中，这样 process.env.API_KEY 才能在浏览器中生效
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});