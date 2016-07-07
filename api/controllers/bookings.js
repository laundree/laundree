/**
 * Created by budde on 09/06/16.
 */

const {BookingHandler, MachineHandler} = require('../../handlers')
const {api} = require('../../utils')

function listBookings (req, res) {
  const limit = req.swagger.params.page_size.value
  const machineId = req.swagger.params.machineId.value
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
  MachineHandler.findFromId(machineId)
    .then((machine) => {
      if (!machine) return api.returnError(res, 404, 'Machine not found')
      filter.machine = machine.model._id
      return machine.fetchLaundry().then((laundry) => {
        if (!laundry) return
        if (!laundry.isUser(req.user)) return api.returnError(res, 404, 'Machine not found')
        return BookingHandler.find(filter, {limit, sort: {_id: 1}})
          .then((bookings) => bookings.map((booking) => booking.toRestSummary()))
          .then((bookings) => {
            var links = {
              first: `/api/machines/${machineId}/bookings?page_size=${limit}`
            }
            if (bookings.length === limit) {
              links.next = `/api/machines/${machineId}/bookings?since=${bookings[bookings.length - 1].id}&page_size=${limit}`
            }
            res.links(links)
            res.json(bookings)
          })
      })
    })
    .catch(api.generateErrorHandler(res))
}

function createBooking (req, res) {
  const {from, to} = req.swagger.params.body.value
  const machineId = req.swagger.params.machineId.value
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (fromDate >= toDate) return api.returnError(res, 400, 'From must be before to')
  MachineHandler
    .findFromId(machineId)
    .then((machine) => {
      if (!machine) return api.returnError(res, 404, 'Machine not found')
      return machine.fetchLaundry().then((laundry) => {
        if (!laundry.isUser(req.user)) return api.returnError(res, 404, 'Machine not found')
        machine.fetchBookings(fromDate, toDate)
          .then(([booking]) => {
            if (booking) return api.returnError(res, 409, 'Machine not available', {Location: booking.restUrl})
            return machine
              .createBooking(req.user, from, to)
              .then((machine) => api.returnSuccess(res, machine.toRest()))
          })
      })
    })
    .catch(api.generateErrorHandler(res))
}

function fetchBooking (req, res) {
  const id = req.swagger.params.id.value
  BookingHandler
    .findFromId(id)
    .then((booking) => {
      if (!booking) return api.returnError(res, 404, 'Booking not found')
      return booking.fetchMachine()
        .then((machine) => machine.fetchLaundry())
        .then((laundry) => {
          if (!laundry.isUser(req.user)) return api.returnError(res, 404, 'Booking not found')
          return api.returnSuccess(res, booking.toRest())
        })
    })
    .catch(api.generateErrorHandler(res))
}

function deleteBooking (req, res) {
  const id = req.swagger.params.id.value
  BookingHandler
    .findFromId(id)
    .then((booking) => {
      if (!booking) return api.returnError(res, 404, 'Booking not found')
      if (booking.isOwner(req.user)) return booking.deleteBooking().then(() => api.returnSuccess(res))
      return booking.fetchMachine()
        .then((machine) => machine.fetchLaundry())
        .then((laundry) => {
          if (laundry.isOwner(req.user)) return booking.deleteBooking().then(() => api.returnSuccess(res))
          if (laundry.isUser(req.user)) return api.returnError(res, 403, 'Not allowed')
          return api.returnError(res, 404, 'Booking not found')
        })
    })
    .catch(api.generateErrorHandler(res))
}

module.exports = {
  listBookings: listBookings,
  createBooking: createBooking,
  fetchBooking: fetchBooking,
  deleteBooking: deleteBooking
}
