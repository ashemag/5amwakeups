import type { MetadataRoute } from "next";

const siteUrl = "https://5amwakeups.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-03-23"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date("2026-03-23"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
