// @flow

import BookingHandler from '../../handlers/booking'
import * as api from '../helper'
import type { DateTimeObject } from '../../handlers/laundry'
import { StatusError } from '../../utils/error'

async function listBookingsAsync (subjects, params: { page_size: number, machineId: string, since?: string, from: number, to: number }, req, res) {
  const {page_size: limit, since, from, to} = params
  const filter: { from: *, to: *, _id?: *, machine?: * } = {
    from: {$gte: from},
    to: {$lt: to}
  }
  if (since) {
    filter._id = {$gt: since}
  }
  const {machine} = api.assertSubjects({machine: subjects.machine})
  filter.machine = machine.model._id
  const bookings = await BookingHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const bookingSummaries = bookings.map(BookingHandler.restSummary)
  const fromToQuerySegment = (from ? `&from=${from}` : '') + (to ? `&from=${to}` : '')
  const links: { first: string, next?: string } = {
    first: `/api/machines/${machine.model.id}/bookings?page_size=${limit}${fromToQuerySegment}`
  }
  if (bookingSummaries.length === limit) {
    links.next = `/api/machines/${machine.model.id}/bookings?since=${bookingSummaries[bookingSummaries.length - 1].id}&page_size=${limit}${fromToQuerySegment}`
  }
  res.links(links)
  return bookingSummaries
}

async function createBookingAsync (subjects, params: { machineId: string, body: { from: DateTimeObject, to: DateTimeObject } }) {
  const {machine, laundry, currentUser} = api.assertSubjects({machine: subjects.machine, currentUser: subjects.currentUser, laundry: subjects.laundry})
  if (machine.model.broken) {
    throw new StatusError('Machine is broken', 400)
  }
  const {from, to} = params.body
  if (!laundry.validateDateObject(from) || !laundry.validateDateObject(to)) {
    throw new StatusError('Invalid date', 400)
  }
  let fromDate = laundry.dateFromObject(from)
  let toDate = laundry.dateFromObject(to)
  if (fromDate >= toDate) { // Test that from is before to
    throw new StatusError('From must be before to', 400)
  }
  if (fromDate.getTime() <= (Date.now() + 10 * 60 * 1000)) { // Test that booking is after now
    throw new StatusError('Too soon', 400)
  }
  if (!laundry.checkTimeLimit(from, to)) { // Test that booking meets time limit
    throw new StatusError('Time limit violation', 400)
  }
  if (to.hour < 24 && !laundry.isSameDay(from, to)) { // Test that booking isn't cross day
    throw new StatusError('From and to must be same day', 400)
  }
  const [dailyResult, limitResult] = await Promise
    .all([
      laundry.checkDailyLimit(currentUser, from, to), // Test that daily limit isn't violated
      laundry.checkLimit(currentUser, from, to) // Test that limit isn't violated
    ])
  if (!dailyResult) {
    throw new StatusError('Daily limit violation', 400)
  }
  if (!limitResult) {
    throw new StatusError('Limit violation', 400)
  }
  let [booking] = await machine.fetchBookings(fromDate, toDate)
  if (booking) { // Test for existing booking
    throw new StatusError('Machine not available', 409, {Location: booking.restUrl})
  }
  const newBooking = await machine.createAndMergeBooking(currentUser, fromDate, toDate)
  return newBooking.toRest()
}

function fetchBookingAsync (subjects) {
  const {booking} = api.assertSubjects({booking: subjects.booking})
  return booking.toRest()
}

async function deleteBookingAsync (subjects) {
  const {booking} = api.assertSubjects({booking: subjects.booking})
  await booking.deleteBooking()
}

async function updateBookingAsync (subjects, params: { bookingId: string, laundryId: string, body: { from?: DateTimeObject, to?: DateTimeObject } }) {
  const {booking, laundry, currentUser} = api.assertSubjects({booking: subjects.booking, currentUser: subjects.currentUser, laundry: subjects.laundry})
  const {from, to} = params.body
  if (!from && !to) {
    return
  }
  let newFrom = booking.model.from
  let newTo = booking.model.to
  if (from) {
    const fromDate = laundry.dateFromObject(from)
    if (fromDate < booking.model.from) {
      throw new StatusError('Invalid input', 400)
    }
    newFrom = fromDate
  }
  if (to) {
    const toDate = laundry.dateFromObject(to)
    if (toDate > booking.model.to) {
      throw new StatusError('Invalid input', 400)
    }
    newTo = toDate
  }

  if (newTo.getTime() <= newFrom.getTime()) {
    throw new StatusError('Invalid input', 400)
  }

  await booking.updateTime(currentUser, newFrom, newTo)
}

export const listBookings = api.wrap(listBookingsAsync, api.securityLaundryUser, api.securityAdministrator)
export const createBooking = api.wrap(createBookingAsync, api.securityLaundryUser)
export const fetchBooking = api.wrap(fetchBookingAsync, api.securityLaundryUser, api.securityAdministrator)
export const deleteBooking = api.wrap(deleteBookingAsync, api.securityBookingCreator, api.securityLaundryOwner)
export const updateBooking = api.wrap(updateBookingAsync, api.securityBookingCreator)
