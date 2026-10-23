import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CUBE",
    short_name: "CUBE",
    description: "مدیریت زبان‌آموزان، جلسه‌ها، شهریه و درآمد",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fa",
    background_color: "#060914",
    theme_color: "#060914",
    icons: [
      { src: "/icons/cube-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
