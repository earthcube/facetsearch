import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
//const rawFile = require('vite-raw-plugin')
import * as path from 'path';
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const packageJson = fs.readFileSync('./package.json')
    const version = JSON.parse(packageJson).version || 0
    var now = new Date();
    var isoString = now.toISOString().substr(0,10);
    return {
        define: {
            "import.meta.env.VITE_APP_PACKAGE_VERSION": JSON.stringify(version),
            "import.meta.env.VITE_APP_DATE":  JSON.stringify(isoString),


        },
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
    }

})
