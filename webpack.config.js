const path = require('path')
const webpack = require('webpack')
const WebpackChunkHash = require('webpack-chunk-hash')
const ChunkManifestPlugin = require('chunk-manifest-webpack-plugin')

module.exports = {
  entry: './client/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/javascripts')
  },
  module: {
    rules: [
      {test: /\.js$/, use: 'babel-loader'},
      {test: /pdfkit|fontkit|unicode-properties|png-js|brotli/, loader: 'transform-loader?brfs'},
      {test: /\.json$/, loader: 'json-loader'}
    ]
  }
}
