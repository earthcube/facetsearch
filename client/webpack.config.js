const path = require('path')

module.exports = {
    contentBase: path.resolve(__dirname, 'public'),
    output: {
        publicPath: 'auto',
    },
    resolve: {
        alias: {
            vue: '@vue/compat'
        }
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    compilerOptions: {
                        compatConfig: {
                            MODE: 2
                        }
                    }
                }
            },
            {
                test: /\.txt$/i,
                use: 'raw-loader',
            },
        ],
    },
};
