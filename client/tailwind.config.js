/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            500: '#2563EB', // Royal Blue
            600: '#1D4ED8',
            700: '#1E40AF',
          },
          orange: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            500: '#EA580C', // Accent Orange
            600: '#C2410C',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'premium-sm': '6px',
        'premium-md': '8px',
        'premium-lg': '12px',
        'premium-xl': '16px',
      },
      boxShadow: {
        'premium-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
        'premium-2': '0px 4px 8px -2px rgba(0, 0, 0, 0.04), 0px 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'premium-3': '0px 12px 16px -4px rgba(0, 0, 0, 0.08), 0px 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'premium-4': '0px 24px 48px -12px rgba(0, 0, 0, 0.16), 0px 0px 1px 0px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
