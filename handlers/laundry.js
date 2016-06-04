/**
 * Created by budde on 02/06/16.
 */
const {LaundryModel} = require('../models')
const Handler = require('./handler')

class LaundryHandler extends Handler {

  static find (filter, limit) {
    return LaundryModel
      .find(filter, null, {sort: {'_id': 1}})
      .limit(limit || 10)
      .exec()
      .then((tokens) => tokens.map((model) => new LaundryHandler(model)))
  }

  /**
   * Create a new laundry.
   * @param {UserHandler} owner
   * @param {string} name
   * @return {Promise.<LaundryHandler>}
   */
  static _createLaundry (owner, name) {
    return new LaundryModel({
      name: name,
      owners: [owner.model._id],
      users: [owner.model._id]
    })
      .save()
      .then((model) => new LaundryHandler(model))
  }

  toRestSummary () {
    return {name: this.model.name, id: this.model.id, href: `/api/laundries/${this.model.id}`}
  }
}

module.exports = LaundryHandler
