import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A página /instalar entrega o SQL do banco para o dono copiar.
  outputFileTracingIncludes: { "/instalar": ["./supabase/instalacao.sql"] },
  async headers() {
    const semCache = [
      { key: "Cache-Control", value: "no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];
    return [
      { source: "/auth/:path*", headers: semCache },
      { source: "/api/:path*", headers: semCache },
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
