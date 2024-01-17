const path = require('path')

module.exports = {
    contentBase: path.resolve(__dirname, 'public'),
    output: {
        publicPath: 'auto',
    },
    resolve: {
        alias: {
            vue: '@vue/compat',
            // // If using the runtime only build
            // vue$: 'vue/dist/vue.runtime.esm.js' // 'vue/dist/vue.runtime.common.js' for webpack 1
            // // Or if using full build of Vue (runtime + compiler)
            // // vue$: 'vue/dist/vue.esm.js'      // 'vue/dist/vue.common.js' for webpack 1
        },

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
