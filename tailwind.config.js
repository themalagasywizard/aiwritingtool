/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./auth/*.html",
    "./functions/*.js",
    "./lib/*.js",
    "./scripts/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4B5EAA',
        primaryLight: '#E6E9F0',
        secondary: '#6B7280',
        accent: '#F472B6',
        background: '#F9FAFB',
        textPrimary: '#1F2937',
        textSecondary: '#9CA3AF',
        success: '#34D399',
        error: '#EF4444',
        warning: '#FBBF24',
      }
    }
  },
  plugins: [],
}