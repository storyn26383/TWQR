import tailwindcss from '@tailwindcss/vite'

const baseURL = process.env.NUXT_APP_BASE_URL ?? '/'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-24',
  ssr: false,
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      title: 'TWQR 收款碼',
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#8c0327' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'manifest', href: `${baseURL}manifest.webmanifest` },
        { rel: 'icon', href: `${baseURL}icon.svg`, type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: `${baseURL}icon.svg` },
      ],
    },
  },
})
