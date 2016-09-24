/**
 * Subscribes to an emitter and returns unsubscription method.
 * @param {EventEmitter} emitter
 * @param {string} event
 * @param {function} handler
 * @returns {{remove: (function(): *)}}
 */
function on (emitter, event, handler) {
  emitter.on(event, handler)
  return {
    remove: () => emitter.removeListener(event, handler)
  }
}

module.exports = {
  on
}
