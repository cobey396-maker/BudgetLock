import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: env.appUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${env.appUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${env.appUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
