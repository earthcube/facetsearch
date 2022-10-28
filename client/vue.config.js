const webpack = require('webpack');
const fs = require('fs')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0
var now = new Date();
var isoString = now.toISOString().substr(0,10);

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
                    'process.env': {
                        PACKAGE_VERSION: '"' + version + '"',
                        DATE: '"' + isoString+ '"',

                    }
                })
            ],
            performance: {
                hints: "warning", // enum
                maxAssetSize: 1048576, // int (in bytes),
                maxEntrypointSize: 1048576, // int (in bytes)
            },
            optimization: {
                runtimeChunk: 'single',
                splitChunks: {
                    chunks: "all",
                    maxInitialRequests: Infinity,
                    minSize: 0,
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name(module) {
                                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                                return `npm.${packageName.replace('@', '')}`;
                            },
                        },
                    }
                }
            }
        }


}
