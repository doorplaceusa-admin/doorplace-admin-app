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
      "https://tradepilot.doorplaceusa.com/sitemap-index-1.xml",
      "https://tradepilot.doorplaceusa.com/sitemap-index-2.xml",
      "https://tradepilot.doorplaceusa.com/sitemap-index-3.xml",
      "https://tradepilot.doorplaceusa.com/sitemap-index-4.xml",
      "https://tradepilot.doorplaceusa.com/sitemap-index-5.xml",
      "https://tradepilot.doorplaceusa.com/sitemap-index-6.xml",
    ],
  };
}