/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {EventModel} = require('../models')
const debug = require('debug')('laundree.handlers.event')

class EventHandler extends Handler {
  static createEvent (type, handler) {
    const user = EventHandler._currentUser && EventHandler._currentUser.model._id
    const model = handler.model.constructor.modelName
    return new EventModel({
      reference: handler.model._id,
      type,
      model,
      user,
      data: handler.eventData
    })
      .save()
      .then(model => new EventHandler(model))
  }

  static trackingMiddleware () {
    return (req, res, next) => {
      if (!req.user) return next()
      debug(`Tracking with user: ${req.user.model._id}`)
      EventHandler._currentUser = req.user
      res.on('finish', () => {
        debug('Request finished')
        EventHandler._currentUser = null
      })
      next()
    }
  }

  get reduxModel () {
    return {
      type: this.model.type,
      model: this.model.model,
      reference: this.model.reference,
      createdAt: this.model.createdAt
    }
  }
}

Handler.setupHandler(EventHandler, EventModel)

module.exports = EventHandler
