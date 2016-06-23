/**
 * Created by budde on 27/04/16.
 */
const {regex} = require('../utils')

class Handler {

  /**
   * @param Model
   * @param Handler
   * @param filter
   * @param limit
   * @returns {Promise.<Handler>}
   */
  static _find (Model, Handler, filter, limit) {
    return Model
      .find(filter, null, {sort: {'_id': 1}})
      .limit(limit || 10)
      .exec()
      .then((tokens) => tokens.map((model) => new Handler(model)))
  }

  static _findFromId (Model, Handler, id) {
    if (!regex.mongoDbId.exec(id)) return Promise.resolve(undefined)
    return Model.findFromId(id)
      .exec()
      .then((m) => m ? new Handler(m) : undefined)
  }

  static _on (emitter, args) {
    return emitter.on.apply(emitter, args)
  }

  static _removeListener (emitter, args) {
    return emitter.removeListener.apply(emitter, args)
  }

  _emitEvent (emitter, event) {
    emitter.emit(event, this)
  }

  /**
   * @constructor
   * @template T
   * @param {T} model
   */
  constructor (model) {
    if (!model) throw new Error('Model may not be undefined!')
    this.model = model
  }

}

module.exports = Handler
