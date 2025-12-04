import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'supabase': {
          DEFAULT: '#3ECF8E',
          dark: '#2FB078',
          light: '#5DDBA2',
        },
      },
    },
  },
  plugins: [],
};
export default config;
