/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF8F5',
        'cream-dark': '#F5EDE8',
        blush: '#D4A89C',
        'blush-light': '#E8CCC4',
        'blush-dark': '#B8877A',
        rose: '#C47D6B',
        'rose-dark': '#A85D4D',
        charcoal: '#2D2926',
        'charcoal-light': '#4A4543',
        sand: '#E8DDD5',
        sage: '#8B9A7E',
        'sage-light': '#A8B89E',
        ivory: '#FFFDF9',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 20px rgba(45, 41, 38, 0.06)',
        'card': '0 4px 24px rgba(45, 41, 38, 0.08)',
        'card-hover': '0 8px 40px rgba(45, 41, 38, 0.12)',
        'glow': '0 0 40px rgba(212, 168, 156, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
