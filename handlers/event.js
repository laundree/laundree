/**
 * Created by budde on 09/06/16.
 */

const Handler = require('./handler')
const {EventModel} = require('../models')

class EventHandler extends Handler {
  static createEvent (type, handler) {
    const model = handler.model.constructor.modelName
    return new EventModel({
      reference: handler.model._id,
      type,
      model
    })
      .save()
      .then(model => new EventHandler(model))
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
