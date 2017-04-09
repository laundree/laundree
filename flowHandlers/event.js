// @flow

import { Handler, Library, HandlerInterface } from './handler'
import type { UserHandler } from './user'
import type { EventDocument } from '../flowModels/event'
import { EventModel } from '../flowModels/event'
const debug = require('debug')('laundree.handlers.event')
type Request = express$Request & { user?: UserHandler }
type Response = express$Response
type NextFunction = express$NextFunction

export class EventHandler extends Handler<EventHandler, EventDocument> {
  static updateActions = []

  constructor (doc: EventDocument) {
    super(doc, EventHandler.updateActions)
  }

  buildReduxModel (): { type: string, model: string, reference: string, createdAt: string } {
    return {
      type: this.doc.type,
      model: this.doc.model,
      reference: this.doc.reference,
      createdAt: this.doc.createdAt.toISOString()
    }
  }
}

export class EventLibrary extends Library {

  currentUser: ?UserHandler

  async createEvent (type: string, handler: HandlerInterface<*, *>): Promise<EventHandler> {
    const user = this.currentUser && this.currentUser.doc.id
    const model = handler.doc.constructor.modelName
    const doc = await new EventModel({
      reference: handler.doc._id,
      type,
      model,
      user,
      data: handler.buildEventData()
    })
      .save()
    return new EventHandler(doc)
  }

  handler () {
    return this
  }

  buildTrackingMiddleware () {
    return (req: Request, res: Response, next: NextFunction): mixed => {
      if (!req.user) {
        return next()
      }
      debug(`Tracking with user: ${req.user.doc._id}`)
      this.currentUser = req.user
      res.on('finish', () => {
        debug('Request finished')
        this.currentUser = null
      })
      next()
    }
  }
}
