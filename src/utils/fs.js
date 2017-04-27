const fs = require('fs')

function cbFromResolveReject (resolve, reject) {
  return (err, data) => {
    if (err) return reject(err)
    return resolve(data)
  }
}

function wrap (action, path, options) {
  return new Promise((resolve, reject) => {
    if (options) {
      action(path, options, cbFromResolveReject(resolve, reject))
    } else {
      action(path, cbFromResolveReject(resolve, reject))
    }
  })
}

function readFile (path, options) {
  return wrap(fs.readFile, path, options)
}

function readdir (path, options) {
  return wrap(fs.readdir, path, options)
}

module.exports = {readFile, readdir}
