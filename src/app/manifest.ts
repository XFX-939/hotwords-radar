import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0B1020",
    theme_color: "#0284C7",
    icons: [
      {
        src: "/favicon.png?v=2",
        sizes: "64x64",
        type: "image/png"
      },
      {
        src: "/icon.png?v=2",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png?v=2",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
