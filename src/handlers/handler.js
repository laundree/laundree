// @flow
import { regex } from '../utils'
import EventEmitter from 'events'
import { linkEmitter } from '../lib/redis'
import Debug from 'debug'
import base64UrlSafe from 'urlsafe-base64'
import type { ObjectId, Model, QueryOptions, QueryConditions } from 'mongoose'
import type { Action } from 'laundree-sdk/src/redux'

const debug = Debug('laundree.handlers.handler')

type ReduxActionCreator<A> = (a: Handler<*, A> | string) => ?Action

type ActionCreators<A> = {
  create?: ReduxActionCreator<A>,
  delete?: ReduxActionCreator<A>,
  update?: ReduxActionCreator<A>
}

export class HandlerLibrary<ReduxModel: {}, M: Model<*>, H: Handler<M, ReduxModel>> {
  _Handler: Class<H>
  _Model: Class<M>
  subEmitter: EventEmitter = new EventEmitter()
  pubEmitter: EventEmitter = new EventEmitter()
  redux: EventEmitter

  constructor (_Handler: Class<H>, _Model: Class<M>, actionCreators: ActionCreators<ReduxModel> = {}) {
    this._Handler = _Handler
    this._Model = _Model
    linkEmitter(
      this.subEmitter,
      this.pubEmitter,
      _Handler.name,
      ['create', 'update'],
      (instance) => Promise.resolve(instance.model.id),
      id => this.findFromId(id))
    linkEmitter(
      this.subEmitter,
      this.pubEmitter,
      _Handler.name,
      ['delete'],
      (instance) => Promise.resolve(instance.model.id),
      id => Promise.resolve(id))
    this.redux = this._buildReduxEventEmitter(actionCreators)
  }

  _buildReduxEventEmitter (actionCreators: ActionCreators<ReduxModel>) {
    const emitter = new EventEmitter()
    if (actionCreators.delete) this._setupListener(emitter, 'delete', actionCreators.delete)
    if (actionCreators.create) this._setupListener(emitter, 'create', actionCreators.create)
    if (actionCreators.update) this._setupListener(emitter, 'update', actionCreators.update)
    return emitter
  }

  _setupListener (emitter: EventEmitter, event: string, action: ReduxActionCreator<ReduxModel>) {
    debug(`Setting up socket with event "${event}" on "${this._Handler.name}"`)
    this.on(event, handler => {
      if (!handler) {
        debug('Handler not found, returning')
        return
      }
      const laundries = findLaundries(handler)
      const id = handler.model ? handler.model.id : handler
      debug(`Emitting ${this._Handler.name} ${event} action`)
      emitter.emit('action', {id, laundries, action: action(handler)})
    })
  }

  async findFromId (id: string) : Promise<*> {
    if (!regex.mongoDbId.exec(id)) {
      return null
    }
    const model = await this._Model.findById(id)
      .exec()
    return model && (new this._Handler(model)).updateDocument()
  }

  async find (filter: QueryConditions, options: QueryOptions = {}): Promise<*> {
    const models = await this._Model
      .find(filter, null, options)
      .exec()
    return Promise.all(models.map((model) => (new this._Handler(model)).updateDocument()))
  }

  on (event: string, callback: Function) {
    this.pubEmitter.on(event, callback)
  }

  removeListener (event: string, callback: Function) {
    this.pubEmitter.removeListener(event, callback)
  }

  fetchCount (criteria: QueryConditions = {}) : Promise<number> {
    return this._Model.count(criteria).exec()
  }

  findFromShortId (shortId: string) {
    return this.findFromId(base64UrlSafe.decode(shortId).toString('hex'))
  }

  emitEvent (event: 'create' | 'update' | 'delete', instance: H) {
    this.subEmitter.emit(event, instance)
  }
}

function findLaundries (handler: { model: { _id: ObjectId, laundry?: ObjectId, laundries?: ObjectId[] } } | string): string[] {
  const {_id, laundry, laundries} = typeof handler === 'string' ? {} : handler.model
  if (laundry) return [laundry.toString()]
  if (laundries) return laundries.map(id => id.toString())
  if (_id) return [_id.toString()]
  return []
}

type UpdateAction<A> = (A) => Promise<A>

export class Handler<M: Model<*>, ReduxModel: {}> {
  model: M
  lib: HandlerLibrary<ReduxModel, M, *>
  updateActions: UpdateAction<*>[] = []

  constructor (model: M) {
    this.model = model
  }

  async save () {
    await this.model.save()
    await this.lib.emitEvent('update', this)
    return this
  }

  shortId (): string {
    return base64UrlSafe.encode(Buffer.from(this.model.id, 'hex'))
  }

  /**
   * Update this document
   * @returns {Promise.<Handler>}
   */
  async updateDocument () {
    if (typeof this.model.docVersion !== 'number') {
      return this
    }
    const updater = this.updateActions[this.model.docVersion]
    if (!updater) {
      return this
    }
    const name = this.constructor.name
    debug(`Updating ${name} document`)
    const newHandler = await (updater: UpdateAction<*>)(this)
    debug(`${name} document updated to version ${typeof newHandler.model.docVersion === 'number' ? newHandler.model.docVersion : 'X'}`)
    return newHandler.updateDocument()
  }

  reduxModel (): ReduxModel {
    throw new Error('Not implemented!')
  }
}
