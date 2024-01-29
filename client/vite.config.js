import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//const rawFile = require('vite-raw-plugin')
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    //https://github.com/vitejs/vite/issues/6985
    build: {
        target: 'esnext'
    },
    resolve: {
        alias: {
            vue: '@vue/compat',
            "@": path.resolve(__dirname, "./src"),
        }
    },
    plugins: [vue({
        template: {
            compilerOptions: {
                compatConfig: {
                    MODE: 2
                }
            }
        }
    }),
        // rawFile({
        //     fileRegex: /\.txt$/
        // })

    ],
})
