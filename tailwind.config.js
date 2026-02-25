/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        cinzel: ["Cinzel", "ui-serif", "Georgia", "serif"],
        playfair: ["Playfair Display", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
