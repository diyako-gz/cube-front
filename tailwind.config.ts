import type { Config } from "tailwindcss";

// Every color is a CSS variable (see globals.css) so light and dark themes share one set of classes.
const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("bg"), panel: c("panel"), fg: c("fg"), muted: c("muted"),
        neon: c("neon"), violet: c("violet"), pink: c("pink"),
        lime: c("lime"), rose: c("rose"), amber: c("amber"),
        onaccent: c("on-accent"),
        line: "rgb(var(--line) / var(--line-a))",
      },
      fontFamily: { sans: ['"Vazirmatn Variable"', "Tahoma", "sans-serif"] },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "none" } },
        pop: { from: { opacity: "0", transform: "scale(.3)" }, to: { opacity: "1", transform: "scale(1)" } },
        grow: { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 6px rgb(var(--neon))" },
          "50%": { boxShadow: "0 0 16px rgb(var(--neon)), 0 0 28px rgb(var(--neon) / .5)" },
        },
      },
      animation: {
        rise: "rise .7s cubic-bezier(.2,.7,.2,1) both",
        pop: "pop .5s cubic-bezier(.3,1.6,.5,1) both",
        grow: "grow .8s cubic-bezier(.2,.7,.2,1) both",
        fade: "fade .3s ease-out both",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
