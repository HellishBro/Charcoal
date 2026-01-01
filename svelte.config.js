import adapter from "@sveltejs/adapter-cloudflare";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            config: undefined,
            platformProxy: {
                configPath: undefined,
                environment: undefined,
                persist: undefined
            },
            fallback: 'plaintext',
            routes: {
                include: ['/*'],
                exclude: ['<all>']
            }
        })
    }
};

export default config;