/**
 * Created by budde on 09/06/16.
 */

const {BookingHandler} = require('../../handlers')
const {api} = require('../../utils')
const Promise = require('promise')

function listBookings (req, res) {
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  const from = req.swagger.params.from.value
  const to = req.swagger.params.to.value
  const filter = {
    from: {$gte: from},
    to: {$lt: to}
  }
  if (since) {
    filter._id = {$gt: since}
  }
  const {machine} = req.subjects
  filter.machine = machine.model._id
  return BookingHandler.find(filter, {limit, sort: {_id: 1}})
    .then((bookings) => bookings.map((booking) => booking.toRestSummary()))
    .then((bookings) => {
      var links = {
        first: `/api/machines/${machine.model.id}/bookings?page_size=${limit}`
      }
      if (bookings.length === limit) {
        links.next = `/api/machines/${machine.model.id}/bookings?since=${bookings[bookings.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(bookings)
    })
    .catch(api.generateErrorHandler(res))
}

function createBooking (req, res) {
  const {machine, laundry} = req.subjects
  const {from, to} = req.swagger.params.body.value
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (fromDate >= toDate) return api.returnError(res, 400, 'From must be before to')
  if (fromDate.getTime() <= (Date.now() + 10 * 60 * 1000)) return api.returnError(res, 400, 'Too soon')
  // TODO use moment
  const dateTimeFormat = new Intl.DateTimeFormat({}, {minute: 'numeric', timeZone: laundry.timezone})
  if (parseInt(dateTimeFormat.format(fromDate)) % 30) return api.returnError(res, 400, 'Started at wrong minute')
  if (parseInt(dateTimeFormat.format(toDate)) % 30) return api.returnError(res, 400, 'Ended at wrong minute')
  return machine.fetchBookings(fromDate, toDate)
    .then(([booking]) => {
      if (booking) return api.returnError(res, 409, 'Machine not available', {Location: booking.restUrl})
      return BookingHandler
        .findAdjacentBookingsOfUser(req.user, machine, fromDate, toDate)
        .then(({before, after}) => {
          const promises = []
          var from = fromDate
          var to = toDate
          if (before) {
            promises.push(before.deleteBooking())
            from = before.model.from
          }
          if (after) {
            promises.push(after.deleteBooking())
            to = after.model.to
          }
          return Promise.all(promises)
            .then(() => machine.createBooking(req.user, from, to))
            .then((machine) => api.returnSuccess(res, machine.toRest()))
        })
    })
    .catch(api.generateErrorHandler(res))
}

function fetchBooking (req, res) {
  const {booking} = req.subjects
  return api.returnSuccess(res, booking.toRest())
}

function deleteBooking (req, res) {
  const {booking} = req.subjects
  booking.deleteBooking()
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

module.exports = {
  listBookings: listBookings,
  createBooking: createBooking,
  fetchBooking: fetchBooking,
  deleteBooking: deleteBooking
}
