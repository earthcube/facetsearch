module.exports = {
    publicPath: '/',
    // publicPath: process.env.NODE_ENV === 'production'
    //     ? '/client/'
    //     : '/'

        configureWebpack: {
            performance: {
                hints: "warning", // enum
                maxAssetSize: 1048576, // int (in bytes),
                maxEntrypointSize: 1048576, // int (in bytes)
            },
            optimization: {
                splitChunks: {
                    cacheGroups: {
                        shared: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendor',
                            enforce: true,
                            chunks: 'all',
                        }
                    }
                }
            }
        }


}
