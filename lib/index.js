'use strict';

require('./server').then(function (start) {
  return start();
});