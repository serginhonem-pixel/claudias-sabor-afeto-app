import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rose:    { DEFAULT: "#C4566A", light: "#FAEDEF", mid: "#E8A0AE" },
        caramel: { DEFAULT: "#B87444", light: "#FBF3EC" },
        cream:   "#FDF8F4",
        dark:    "#2A1F1A",
        muted:   "#7A6860",
      },
      fontFamily: {
        sans:    ["DM Sans", "system-ui", "sans-serif"],
        heading: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
