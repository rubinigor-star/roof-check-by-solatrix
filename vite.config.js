import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    alias: [
      { find: './src/pdfReport.js', replacement: '/src/pdfReportHotfix.js' }
    ]
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        privateHomes: 'private-homes.html',
        solarPrice: 'solar-price.html',
        roofCheckLanding: 'roof-check.html',
        roofCheckApp: 'roof-check/index.html',
        storage: 'storage.html',
        business: 'business.html',
        agriculture: 'agriculture.html',
        faq: 'faq.html',
        contact: 'contact.html'
      }
    }
  }
});
