/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        notebook: ['Kalam', 'cursive'],
        y2k: ['"VT323"', 'monospace'],
        diary: ['"Playfair Display"', 'serif'],
        polaroid: ['"Architects Daughter"', 'cursive'],
        academia: ['"Courier Prime"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'scrapbook': '4px 4px 0px 0px rgba(0,0,0,1)',
        'y2k': '0 0 10px #ff007f, 0 0 20px #ff007f',
        'polaroid': '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
