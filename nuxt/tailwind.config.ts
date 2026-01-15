import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/app.vue",
    "./app/components/**/*.{vue,js,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
