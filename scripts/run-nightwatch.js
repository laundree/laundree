#!/usr/bin/env node

const nightwatch = require('nightwatch')

nightwatch.runner({
  config: 'nightwatch.conf.js',
  env: 'default'
}, passed => {
  process.exit(passed ? 0 : 1)
})
