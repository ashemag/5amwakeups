import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/connect-oura"],
      },
    ],
    sitemap: "https://5amwakeups.vercel.app/sitemap.xml",
  };
}
