import { sveltekit } from '@sveltejs/kit/vite';
import {defineConfig, searchForWorkspaceRoot} from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: '0.0.0.0',
        fs: {
            allow: [
                searchForWorkspaceRoot(process.cwd()),
                "/lib/"
            ]
        }
    },
    assetsInclude: [
        "/static/**"
    ]
});
