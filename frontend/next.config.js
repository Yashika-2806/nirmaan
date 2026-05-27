/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    eslint: { ignoreDuringBuilds: false },
    typescript: { ignoreBuildErrors: false },
    images: {
        domains: ['localhost'],
    },
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: '/api/:path*',
                    destination: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/:path*`,
                },
            ],
        };
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
