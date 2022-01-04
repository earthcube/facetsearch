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
                splitChunks: {
                   // chunks: 'all',
                    cacheGroups: {
                        shared: {
                          //  test: /[\\/]node_modules[\\/](vue|vuex|vue-loader|vue-axios)[\\/]/,
                            test: /[\\/]node_modules[\\/]/,
                            // name: 'vendor',
                           // enforce: true,
                           // chunks: 'all',
                            reuseExistingChunk: true,
                        }
                    }
                }
            }
        }


}
