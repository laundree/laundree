// @flow
import regex from '../utils/regex'
import EventEmitter from 'events'
import { linkEmitter } from '../lib/redis'
import { createAction } from 'redux-actions'
import type { Model, QueryConditions, QueryOptions } from 'mongoose'

export type EventType = 'create' | 'update' | 'delete'

const pubEmitters = {}
const subEmitters = {}

function setupEmitters (_Handler: Class<*>): { pub: EventEmitter, sub: EventEmitter } {
  const name = _Handler.name
  const result = {pub: new EventEmitter(), sub: new EventEmitter()}
  pubEmitters[name] = result.pub
  subEmitters[name] = result.sub
  linkEmitter(
    result.sub,
    result.pub,
    name,
    ['create', 'update'],
    i => i.model.id,
    id => _Handler.findFromId(id)
  )
  linkEmitter(
    result.sub,
    result.pub,
    name,
    ['delete'],
    (instance) => instance.model.id,
    id => Promise.resolve(id))
  return result
}

function pubEmitter (_Handler: Class<*>) {
  if (pubEmitters[_Handler.name]) {
    return pubEmitters[_Handler.name]
  }
  const {pub} = setupEmitters(_Handler)
  return pub
}

function subEmitter (_Handler: Class<*>) {
  if (subEmitters[_Handler.name]) {
    return subEmitters[_Handler.name]
  }
  const {sub} = setupEmitters(_Handler)
  return sub
}

export default class Handler<M: Model<*>, H: {model: M}, ReduxModel: { id: string }, RestModel: { id: string, href: string }, RestSummaryModel: { id: string, href: string }> {
  model: M
  _Handler: Class<H>
  generator: (M) => H
  reduxTypes: { delete?: string, create?: string, update?: string }

  static async _find<M: Model<*>, H: Handler<*, *, *, *, *>> (_Model: Class<M>, generator: (M) => H, filter: QueryConditions, options?: QueryOptions): Promise<H[]> {
    const models = await _Model.find(filter, null, options).exec()
    const handlers = models.map(generator)
    await Promise.all(handlers.map(handler => handler.udpdate()))
    return handlers
  }

  static async _findFromId<M: Model<*>, SubHandler: Handler<M, *, *, *, *>> (_Model: Class<M>, generator: (M) => H, id): Promise<?SubHandler> {
    if (!regex.mongoDbId.exec(id)) return null
    const model = await _Model.findById(id).exec()
    if (!model) return null
    const handler = generator(model)
    return handler.update()
  }

  static _emitEvent<H: Handler<*, *, *, *, *>> (type: EventType, _Handler: Class<H>, handler: H) {
    const emitter = subEmitter(_Handler)
    emitter.emit(type, handler)
  }

  static findFromId (id: string) {
    throw new Error('Not implemented')
  }

  static _onDelete<H: Handler<*, *, *, *, *>> (_Handler: Class<H>, cb: (id: string) => void) {
    const emitter = pubEmitter(_Handler)
    emitter.on('delete', cb)
  }

  static _onUpdate<H: Handler<*, *, *, *, *>> (_Handler: Class<H>, cb: (h: H) => void) {
    const emitter = pubEmitter(_Handler)
    emitter.on('update', cb)
  }

  static _onCreate<H: Handler<*, *, *, *, *>> (_Handler: Class<H>, cb: (h: H) => void) {
    const emitter = pubEmitter(_Handler)
    emitter.on('create', cb)
  }

  constructor (model: M, _Handler: Class<H>, generator: *, reduxTypes: *) {
    this.model = model
    this._Handler = _Handler
    this.generator = generator
    this.reduxTypes = reduxTypes
  }

  emitEvent (event: EventType) {
    throw new Error('Not implemented')
  }

  update (): Promise<void> {
    throw new Error('Not implemented')
  }

  onDelete (cb: (id: string) => void) {
    throw new Error('Not implemented')
  }

  onUpdate (cb: (h: H) => void) {
    throw new Error('Not implemented')
  }

  onCreate (cb: (h: H) => void) {
    throw new Error('Not implemented')
  }

  onReduxAction (cb: (r: {| id: string, laundries: string[], action: {} |}) => void) {
    if (this.reduxTypes.delete) {
      const deleteAction = createAction(this.reduxTypes.delete, id => id)
      this.onDelete(id => {
        const data = {id, laundries: [], action: deleteAction(id)}
        cb(data)
      })
    }
    if (this.reduxTypes.create) {
      const cAction = createAction(this.reduxTypes.create, handler => handler.buildReduxModel())
      this.onCreate(handler => {
        const data = {
          id: handler.model.id,
          laundries: handler.findLaundries(),
          action: cAction(handler)
        }
        cb(data)
      })
    }
    if (this.reduxTypes.update) {
      const uAction = createAction(this.reduxTypes.update, handler => handler.buildReduxModel())
      this.onUpdate(handler => {
        const data = {
          id: handler.model.id,
          laundries: handler.findLaundries(),
          action: uAction(handler)
        }
        cb(data)
      })
    }
  }

  buildRedux (): ReduxModel {
    throw new Error('Not implemented')
  }

  buildRestSummary (): RestSummaryModel {
    throw new Error('Not implemented')
  }

  buildRest (): Promise<RestModel> {
    throw new Error('Not implemented')
  }

  findLaundries (): string[] {
    return []
  }
}
