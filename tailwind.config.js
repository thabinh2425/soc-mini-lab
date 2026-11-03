/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#080d16',
        panel: '#0d1522',
        line: '#1b293b',
        cyan: '#39d9ff',
        mint: '#3ef0b5',
        amber: '#ffbd59',
        danger: '#ff5d73',
      },
      boxShadow: {
        glow: '0 0 32px rgba(57, 217, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

