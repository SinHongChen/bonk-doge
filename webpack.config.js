const path = require("path");
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: "production",
    target: "node",
    entry: "./src/index.js",
    output: {
        filename: "index.bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    externals: [
        nodeExternals()
    ],
    module: {
        rules: [
            {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: '@graphql-tools/webpack-loader'
            }
        ]
    },
    optimization: {
        chunkIds: "size",
        // method of generating ids for chunks
        moduleIds: "size",
        // method of generating ids for modules
        mangleExports: "size",
        // rename export names to shorter names
        minimize: true
    }
};