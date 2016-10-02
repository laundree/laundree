/**
 * Created by budde on 27/04/16.
 */
const {regex, events} = require('../utils')
const EventEmitter = require('events')
const {linkEmitter} = require('../lib/redis')
const debug = require('debug')('laundree.handlers.handler')
const Promise = require('promise')

class Handler {

  /**
   * @param Model
   * @param Handler
   * @param filter
   * @param options
   * @returns {Promise.<Handler>}
   */
  static _find (Model, Handler, filter, options = {sort: {'_id': 1}}) {
    return Model
      .find(filter, null, options)
      .exec()
      .then((models) => Promise.all(models.map((model) => new Handler(model).updateDocument())))
  }

  static _findFromId (Model, Handler, id) {
    if (!regex.mongoDbId.exec(id)) return Promise.resolve(undefined)
    return Model.findFromId(id)
      .exec()
      .then((m) => m ? new Handler(m).updateDocument() : undefined)
  }

  static setupHandler (_Handler, _Model) {
    _Handler.subEmitter = new EventEmitter()
    _Handler.pubEmitter = new EventEmitter()
    linkEmitter(
      _Handler.subEmitter,
      _Handler.pubEmitter,
      _Handler.name,
      ['create', 'update'],
      (instance) => Promise.resolve(instance.model.id),
      (id) => _Handler.findFromId(id))
    linkEmitter(
      _Handler.subEmitter,
      _Handler.pubEmitter,
      _Handler.name,
      ['delete'],
      (instance) => Promise.resolve(instance.model.id),
      (id) => Promise.resolve(id))
    _Handler.on = function () {
      return _Handler.pubEmitter.on.apply(_Handler.pubEmitter, arguments)
    }
    _Handler.removeListener = function () {
      return _Handler.pubEmitter.removeListener.apply(_Handler.pubEmitter, arguments)
    }
    _Handler.prototype.emitEvent = function (event) {
      _Handler.subEmitter.emit(event, this)
    }
    _Handler.find = (filter, options) => Handler._find(_Model, _Handler, filter, options)
    _Handler.findFromId = (id) => Handler._findFromId(_Model, _Handler, id)
    _Handler.setupSocket = (socket, {createAction, updateAction, deleteAction}, filter = () => Promise.resolve(true)) => Handler._setupSocket(_Handler, socket, createAction, updateAction, deleteAction, filter)
  }

  static _setupListener (_Handler, socket, event, action, filter) {
    return events.on(_Handler, event, (item) => filter(item).then(f => {
      if (!f) return
      debug(`Emitting ${_Handler.name} ${event} action`)
      socket.emit('action', action(item))
    }))
  }

  static _setupSocket (_Handler, socket, createAction, updateAction, deleteAction, filter) {
    const removers = []
    if (createAction) removers.push(Handler._setupListener(_Handler, socket, 'create', createAction, filter))
    if (updateAction) removers.push(Handler._setupListener(_Handler, socket, 'update', updateAction, filter))
    if (deleteAction) removers.push(Handler._setupListener(_Handler, socket, 'delete', deleteAction, filter))
    return removers
  }

  /**
   * @constructor
   * @template T
   * @param {T} model
   */
  constructor (model, updateActions = []) {
    if (!model) throw new Error('Model may not be undefined!')
    this.model = model
    this._updateActions = updateActions
  }

  save () {
    return this.model
      .save()
      .then(() => this.emitEvent('update'))
      .then(() => this)
  }

  /**
   * Get the current document version
   * @returns {number}
   */
  get docVersion () {
    return this.model.docVersion || 0
  }

  /**
   * Array of update actions
   * @returns {(function (handler: Handler) : Promise.<Handler>)[]}
   */
  get updateActions () {
    return this._updateActions
  }

  /**
   * Update this document
   * @returns {Promise.<Handler>}
   */
  updateDocument () {
    const updater = this.updateActions[this.docVersion]
    if (!updater) return Promise.resolve(this)
    const name = this.constructor.name
    debug(`Updating ${name} document`)
    return updater(this).then((handler) => {
      debug(`${name} document updated to version ${handler.docVersion}`)
      return handler.updateDocument()
    })
  }

}

module.exports = Handler
