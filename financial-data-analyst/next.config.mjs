// @ts-check

import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import pkg from 'webpack';
const { IgnorePlugin } = pkg;


if (process.env.NODE_ENV === "development") {
    setupDevPlatform().catch(error => {
        console.error("Failed to setup dev platform:", error);
    });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    // ... other configurations
    webpack: (config) => {
        config.plugins.push(new IgnorePlugin({ resourceRegExp: /^pg-native$/ }));
        return config;
    },
};

export default nextConfig;