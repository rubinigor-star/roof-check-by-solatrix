import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    alias: [
      { find: './src/pdfReport.js', replacement: '/src/pdfReportHotfix.js' }
    ]
  }
});
