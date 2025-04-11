/** @type {import('next').NextConfig} */
const nextConfig = {
    // reactStrictMode: false,
    images: {
        // domains: [
        //     "api.microlink.io", // Microlink Image Preview
        // ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: "api.microlink.io",
            },
        ]
    },
};

export default nextConfig;
