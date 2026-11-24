import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@easylife/shared-types", "@easylife/shared-config"],
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/explore-services",
        destination: "/services",
        permanent: false,
      },
      {
        source: "/tasks",
        destination: "/post-a-need",
        permanent: false,
      },
      {
        source: "/post-task",
        destination: "/post-a-need",
        permanent: false,
      },
      {
        source: "/book",
        destination: "/post-a-need",
        permanent: false,
      },
      {
        source: "/businesses",
        destination: "/business-hub",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
