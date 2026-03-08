import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
      },
      {
        userAgent: "Bingbot",
        allow: "/",
      },
    ],
    sitemap: [
      "https://tradepilot.doorplaceusa.com/sitemap-index-1",
      "https://tradepilot.doorplaceusa.com/sitemap-index-2",
      "https://tradepilot.doorplaceusa.com/sitemap-index-3",
      "https://tradepilot.doorplaceusa.com/sitemap-index-4",
      "https://tradepilot.doorplaceusa.com/sitemap-index-5",
    ],
  };
}