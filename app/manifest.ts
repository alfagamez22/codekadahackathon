import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GAStos",
    short_name: "GAStos",
    description:
      "Track and compare fuel prices across stations in the Philippines",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Nearby Stations",
        short_name: "Nearby",
        description: "Find gas stations near you",
        url: "/stations/nearby",
        icons: [{ src: "/icons/icon.svg", sizes: "any" }],
      },
      {
        name: "Validate Prices",
        short_name: "Validate",
        description: "Help confirm community price reports",
        url: "/validate",
        icons: [{ src: "/icons/icon.svg", sizes: "any" }],
      },
    ],
    categories: ["utilities", "navigation"],
  };
}
