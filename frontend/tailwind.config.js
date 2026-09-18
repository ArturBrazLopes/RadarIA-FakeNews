/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#08050e",
        surface: {
          50: "rgba(30, 20, 50, 0.4)",
          100: "rgba(22, 14, 38, 0.6)",
          200: "rgba(16, 10, 28, 0.75)",
          300: "rgba(12, 8, 22, 0.85)",
        },
        brand: {
          light: "#c084fc",
          DEFAULT: "#9333ea",
          dark: "#7e22ce",
          glow: "#a855f7",
        },
        confidence: {
          high: "#10b981",    // Emerald green for reliable
          medium: "#f59e0b",  // Amber for doubtful
          low: "#ef4444"      // Coral red for fake
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'purple-glow': '0 0 25px -5px rgba(168, 85, 247, 0.25)',
        'card-glow': '0 0 20px -3px rgba(147, 51, 234, 0.15)',
      },
      borderColor: {
        'glass': 'rgba(168, 85, 247, 0.15)',
        'glass-bright': 'rgba(192, 132, 252, 0.3)',
      }
    },
  },
  plugins: [],
}

