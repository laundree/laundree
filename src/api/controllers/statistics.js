// @flow
import * as api from '../helper'
import LaundryHandler from '../../handlers/laundry'
import UserHandler from '../../handlers/user'
import BookingHandler from '../../handlers/booking'
import MachineHandler from '../../handlers/machine'
async function fetchStatisticsF () {
  return {
    laundryCount: await LaundryHandler.lib.fetchCount(),
    userCount: await UserHandler.lib.fetchCount(),
    bookingCount: await BookingHandler.lib.fetchCount(),
    machineCount: await MachineHandler.lib.fetchCount()
  }
}

export const fetchStatistics = api.wrap(fetchStatisticsF, api.securityWebApplication)
