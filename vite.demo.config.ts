import {defineConfig, loadEnv} from 'vite'

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '')

  return {
    build: {
      outDir: 'demo-dist',
    },
    server: {
      proxy: {
        '/api/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
          configure(proxy) {
            proxy.on('proxyReq', (proxyRequest) => {
              if (env.DEEPSEEK_API_KEY) {
                proxyRequest.setHeader('Authorization', `Bearer ${env.DEEPSEEK_API_KEY}`)
              }
            })
          },
        },
      },
    },
  }
})
