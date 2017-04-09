// @flow
import Debug from 'debug'
import { regex } from '../utils/regex'
import type { Document } from '../flowModels/document'
import base64url from 'base64url'

const debug = Debug(__filename)

export type updateAction<H> = (H) => Promise<H>

export interface HandlerInterface<H, D> {
  doc: D,
  updateActions: updateAction<H>[],
  updateDocument(): Promise<H>,
  buildReduxModel(): {},
  buildEventData(): ?{}
}

export class Handler<H, D: Document> implements HandlerInterface<H, D> {
  doc: D
  updateActions: updateAction<H>[]

  constructor (doc: D, updateActions: updateAction<H>[]) {
    this.doc = doc
    this.updateActions = updateActions
  }

  async updateDocument (): Promise<H> {
    const updater = this.updateActions[this.doc.docVersion]
    if (!updater) {
      return this.handler()
    }
    const name = this.constructor.name
    debug(`Updating ${name} document`)
    const handler = await updater(this)
    debug(`${name} document updated to version ${handler.docVersion}`)
    return handler.updateDocument()
  }

  handler (): H {
    throw new Error('Not implemented')
  }

  buildReduxModel (): {} {
    throw new Error('Not implemented')
  }

  buildEventData (): ?{} {
    return null
  }
}

export interface LibraryInterface<H> {
  findFromId(id: string): Promise<?H>,
  findFromShortId(id: string): Promise<?H>,
  find(filter: {}, options: {}): Promise<H[]>
}

export class Library<H : HandlerInterface<*, *>, D : Document> implements LibraryInterface<H> {
  generator: (D) => H
  model: Class<D>

  constructor (generator: (D) => H, model: Class<D>) {
    this.generator = generator
    this.model = model
  }

  async findFromId (id: string): Promise<?H> {
    if (!regex.mongoDbId.exec(id)) {
      return null
    }
    const doc = await this.model
      .findById(id)
      .exec()
    return this.generator(doc).updateDocument()
  }

  async findFromShortId (id: string): Promise<?H> {
    const longId = base64url.toBuffer(id).toString('hex')
    return this.findFromId(longId)
  }

  async find (filter: {}, options: Object = {sort: {_id: 1}}): Promise<H[]> {
    const docs = await this.model
      .find(filter, options)
      .exec()
    return docs.map(doc => this.generator(doc).updateDocument())
  }
}
