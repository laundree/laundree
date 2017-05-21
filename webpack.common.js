const path = require('path')

module.exports = {
  entry: ['babel-polyfill', './src/client/index.js'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/javascripts')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [
            'react',
            'flow',
            'stage-0',
            [
              'env',
              {
                targets: {
                  browsers: ['last 2 versions', 'safari >= 7']
                }
              }
            ]
          ]
        }
      },
      {test: /pdfkit|fontkit|unicode-properties|png-js|brotli|linebreak/, loader: 'transform-loader?brfs'},
      {test: /\.json$/, loader: 'json-loader'}
    ]
  }
}
