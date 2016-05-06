/**
 * Created by budde on 07/05/16.
 */

var identicon = require('identicon')

/**
 * Generates an identicon
 * @param {string} id
 * @param {int} size
 * @return {Promise.<string>}
 */
function generateIdenticonUrl (id, size) {
  return new Promise((resolve, reject) => {
    identicon.generate({id: id, size: size}, (err, buffer) => {
      if (err) return reject(err)
      resolve(`data:image/png;base64,${buffer.toString('base64')}`)
    })
  })
}

module.exports = {
  generateIdenticonUrl: generateIdenticonUrl
}
