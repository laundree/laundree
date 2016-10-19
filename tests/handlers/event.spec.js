const chai = require('chai')
chai.should()
const {EventHandler} = require('../../handlers')
const dbUtils = require('../db_utils')

describe('handlers', function () {
  this.timeout(10000)
  describe('EventHandler', () => {
    describe('createEvent', () => {
      it('should create event', () => dbUtils.populateUsers(1)
        .then(([ user ]) => EventHandler.createEvent('update', {
          model: {
            _id: user.model._id,
            constructor: {modelName: 'User'}
          },
          eventData: {foo: 'bar'}
        })
          .then(({model: {_id}}) => EventHandler.findFromId(_id))
          .then(handler => {
            handler.model.type.should.equal('update')
            handler.model.reference.toString().should.equal(user.model.id)
            handler.model.data.should.deep.equal({foo: 'bar'})
          })))
    })
  })
})
