import type { NextConfig } from "next";
import path from "path";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  /* config options here */
  ...(isVercel ? {} : {
    output: "standalone",
    outputFileTracingRoot: path.join(process.cwd(), "../../"),
  }),
};

export default nextConfig;
