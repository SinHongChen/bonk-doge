const path = require("path");
const nodeExternals = require('webpack-node-externals');
const WebpackObfuscator = require('webpack-obfuscator');

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
    plugins: [
        new WebpackObfuscator({
            rotateStringArray: true
        })
    ],
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