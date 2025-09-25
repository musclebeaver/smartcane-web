// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // 현재 mode(dev/prod 등)에 맞는 .env 파일 로드
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // 로컬 개발 시 백엔드 프록시 예시 (선택사항)
      // proxy: {
      //   '/api': env.VITE_API_BASE_URL || 'http://localhost:8081',
      // },
    },
    build: {
      outDir: 'dist',
    },
    define: {
      // 환경변수 값을 직접 코드 상수로 치환
      __APP_ENV__: env.APP_ENV,
    },
  }
})
