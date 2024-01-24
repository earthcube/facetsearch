
const webpack = require('webpack');
const fs = require('fs')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0
var now = new Date();
var isoString = now.toISOString().substr(0,10);
const path = require('path')
module.exports = {
    publicPath: '/',

    // publicPath: process.env.NODE_ENV === 'production'
    //     ? '/client/'
    //     : '/'

        // chainWebpack: config => {
        //     config.plugin('copy')
        //         .tap(args => {
        //             args[0].push({
        //                 from: path.resolve(__dirname, 'src/public/config'),
        //                 to: path.resolve(__dirname, 'dist/config'),
        //                 toType: 'dir',
        //                 ignore: ['.DS_Store']
        //             })
        //             return args
        //         })
        // },
        configureWebpack: {
            plugins: [
                new webpack.DefinePlugin({

                        "process.env.PACKAGE_VERSION": '"' + version + '"',
                        "process.env.DATE": '"' + isoString+ '"',

                    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
                    "__VUE_PROD_DEVTOOLS__": 'true',
                })
            ],
            performance: {
                hints: "warning", // enum
                maxAssetSize: 1048576, // int (in bytes),
                maxEntrypointSize: 1048576, // int (in bytes)
            },
            // optimization: {
            //     runtimeChunk: 'single',
            //     splitChunks: {
            //         chunks: "all",
            //         maxInitialRequests: Infinity,
            //         minSize: 0,
            //         cacheGroups: {
            //             vendor: {
            //                 test: /[\\/]node_modules[\\/]/,
            //                 name(module) {
            //                     const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            //                     return `npm.${packageName.replace('@', '')}`;
            //                 },
            //             },
            //         }
            //     }
            // }
        },
    chainWebpack: (config) => {
        config.resolve.alias.set('vue', '@vue/compat')
        // config.resolve.alias.set(
        //     'vue$',
        //     // If using the runtime only build
        //     //path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js')
        //     // Or if using full build of Vue (runtime + compiler)
        //      path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.js')
        // )

        config.module
            .rule('vue')
            .use('vue-loader')
            .tap((options) => {
                return {
                    ...options,
                    compilerOptions: {
                        compatConfig: {
                            MODE: 2
                        }
                    }
                }
            })
    },


}
