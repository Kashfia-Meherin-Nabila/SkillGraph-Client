/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@better-auth/kysely-adapter', 'kysely'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  //  logging: {
  //   serverFunctions: false,   // kills the "└─ ƒ myEvents(...) in 49ms" lines
  //   incomingRequests: false,  // kills the "GET /dashboard/... 200 in Xms" lines
  // }
};

export default nextConfig;