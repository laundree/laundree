#!/usr/bin/env node

const nightwatch = require('nightwatch')

nightwatch.runner({
  config: 'nightwatch.conf.js',
  env: 'default'
}, passed => {
  console.log('Test done got', passed)
  process.exit(passed ? 0 : 1)
})
