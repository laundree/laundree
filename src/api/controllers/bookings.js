// @flow

import BookingHandler from '../../handlers/booking'
import {api} from '../../utils'

async function listBookings (req, res) {
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  const from = req.swagger.params.from.value
  const to = req.swagger.params.to.value
  const filter : {from: *, to: *, _id?: *, machine?: *} = {
    from: {$gte: from},
    to: {$lt: to}
  }
  if (since) {
    filter._id = {$gt: since}
  }
  const {machine} = req.subjects
  filter.machine = machine.model._id
  const bookings = await BookingHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const bookingSummaries = bookings.map(booking => booking.toRestSummary())
  const fromToQuerySegment = (from ? `&from=${from}` : '') + (to ? `&from=${to}` : '')
  const links = {
    first: `/api/machines/${machine.model.id}/bookings?page_size=${limit}${fromToQuerySegment}`,
    next: undefined
  }
  if (bookingSummaries.length === limit) {
    links.next = `/api/machines/${machine.model.id}/bookings?since=${bookingSummaries[bookingSummaries.length - 1].id}&page_size=${limit}${fromToQuerySegment}`
  }
  res.links(links)
  res.json(bookingSummaries)
}

async function createBooking (req, res) {
  const {machine, laundry} = req.subjects
  if (machine.model.broken) {
    return api.returnError(res, 400, 'Machine is broken')
  }
  const {from, to} = req.swagger.params.body.value
  if (!laundry.validateDateObject(from) || !laundry.validateDateObject(to)) {
    return api.returnError(res, 400, 'Invalid date')
  }
  let fromDate = laundry.dateFromObject(from)
  let toDate = laundry.dateFromObject(to)
  if (fromDate >= toDate) { // Test that from is before to
    return api.returnError(res, 400, 'From must be before to')
  }
  if (fromDate.getTime() <= (Date.now() + 10 * 60 * 1000)) { // Test that booking is after now
    return api.returnError(res, 400, 'Too soon')
  }
  if (!laundry.checkTimeLimit(from, to)) { // Test that booking meets time limit
    return api.returnError(res, 400, 'Time limit violation')
  }
  if (to.hour < 24 && !laundry.isSameDay(from, to)) { // Test that booking isn't cross day
    return api.returnError(res, 400, 'From and to must be same day')
  }
  const [dailyResult, limitResult] = await Promise
    .all([
      laundry.checkDailyLimit(req.user, from, to), // Test that daily limit isn't violated
      laundry.checkLimit(req.user, from, to) // Test that limit isn't violated
    ])
  if (!dailyResult) {
    return api.returnError(res, 400, 'Daily limit violation')
  }
  if (!limitResult) {
    return api.returnError(res, 400, 'Limit violation')
  }
  let [booking] = await machine.fetchBookings(fromDate, toDate)
  if (booking) { // Test for existing booking
    return api.returnError(res, 409, 'Machine not available', {Location: booking.restUrl})
  }
  const newBooking = await machine.createAndMergeBooking(req.user, fromDate, toDate)
  return api.returnSuccess(res, newBooking.toRest())
}

function fetchBooking (req, res) {
  const {booking} = req.subjects
  return api.returnSuccess(res, booking.toRest())
}

async function deleteBooking (req, res) {
  const {booking} = req.subjects
  await booking.deleteBooking()
  return api.returnSuccess(res)
}

module.exports = {
  listBookings: api.wrapErrorHandler(listBookings),
  createBooking: api.wrapErrorHandler(createBooking),
  fetchBooking: api.wrapErrorHandler(fetchBooking),
  deleteBooking: api.wrapErrorHandler(deleteBooking)
}
