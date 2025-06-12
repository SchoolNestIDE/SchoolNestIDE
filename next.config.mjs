/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
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
    async headers() {
        return [
            {
                source: "/studenthome/editor",
                headers: [
                    {key: "Cross-Origin-Opener-Policy",
                        value: "same-origin"
                    },
                    {key: "Cross-Origin-Embedder-Policy",
                        value: "require-corp"
                    }
                ]
            },
	    {
		source: "/:path*",
		headers: [{ key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }]
		}
        ]
    }
};

export default nextConfig;
