/**
 * Subscribes to an emitter and returns unsubscription method.
 * @param {EventEmitter} emitter
 * @param {string} event
 * @param {function} handler
 * @param {function=} onRemove
 * @returns {{remove: (function(): *)}}
 */
function on (emitter, event, handler, onRemove) {
  emitter.on(event, handler)
  return {
    remove: () => {
      if (onRemove) onRemove()
      return emitter.removeListener(event, handler)
    }
  }
}

module.exports = {
  on
}
