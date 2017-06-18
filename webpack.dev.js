const Merge = require('webpack-merge')
const CommonConfig = require('./webpack.common')

module.exports = Merge(CommonConfig, {
  devtool: 'source-map'
})
