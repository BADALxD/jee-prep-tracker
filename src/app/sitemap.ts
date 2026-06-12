import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://jee-prep-tracker-woad.vercel.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/subjects/physics`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/subjects/chemistry`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/subjects/mathematics`,
      lastModified: new Date(),
    },
  ];
}