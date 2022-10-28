const path = require('path')

module.exports = {
    contentBase: path.resolve(__dirname, 'public'),
    output: {
        publicPath: 'auto',
    },
    module: {
        rules: [
            {
                test: /\.txt$/i,
                use: 'raw-loader',
            },
        ],
    },
};
