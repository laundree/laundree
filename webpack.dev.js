const Merge = require('webpack-merge')
const CommonConfig = require('./webpack.common')

module.exports = Merge(CommonConfig, {
  devtool: 'source-map',
  output: {
    publicPath: '/javascripts/'
  },
  devServer: {
    proxy: {
      '/': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
