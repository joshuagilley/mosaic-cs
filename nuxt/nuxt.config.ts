// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  vite: {
    server: {
      proxy: {
        '/api': 'http://127.0.0.1:8000'
      }
    }
  },
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        prependPath: true
      }
    },
    routeRules: {
      '/api/**': { proxy: 'http://127.0.0.1:8000/api/**' }
    }
  }
})
