// @flow

import MachineHandler from '../../handlers/machine'
import * as api from '../helper'
import {StatusError} from '../../utils/Error'

async function listMachinesAsync (since, limit, subjects) {
  const {laundry} = api.assertSubjects({laundry: subjects.laundry})
  const filter = {}
  if (since) {
    filter._id = {$gt: since}
  }
  filter.laundry = laundry.model._id
  const machines = await MachineHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const summaries = machines.map(MachineHandler.restSummary)
  return {summaries, linkBase: `/api/laundries/${laundry.model.id}/machines`}
}

async function createMachineAsync (subjects, params) {
  const {laundry, createMachineBody} = api.assertSubjects({laundry: subjects.laundry, createMachineBody: params.createMachineBody})
  const body = createMachineBody
  const name = body.name.trim()
  const type = body.type
  const broken = body.broken
  const [m] = await MachineHandler
    .lib
    .find({name: name, laundry: laundry.model._id})
  if (m) {
    throw new StatusError('Machine already exists', 409, {Location: m.restUrl})
  }
  const machine = await laundry.createMachine(name, type, broken)
  return machine.toRest()
}

async function fetchMachineAsync (subjects) {
  const {machine} = api.assertSubjects({machine: subjects.machine})
  return machine.toRest()
}

async function deleteMachineAsync (subjects) {
  const {laundry, machine} = api.assertSubjects({laundry: subjects.laundry, machine: subjects.machine})
  await laundry.deleteMachine(machine)
}

async function updateMachineAsync (subjects, params) {
  const {updateMachineBody, laundry, machine} = api.assertSubjects({updateMachineBody: params.updateMachineBody, laundry: subjects.laundry, machine: subjects.machine})
  const body = updateMachineBody
  const name = body.name ? body.name.trim() : undefined
  const type = body.type
  const broken = body.broken
  const [m] = await MachineHandler
    .lib
    .find({name, laundry: laundry.model._id})
  if (m && m.model.id !== machine.model.id) {
    throw new StatusError('Machine already exists', 409, {Location: machine.restUrl})
  }
  await machine.update({name, type, broken})
  return machine.toRest()
}

export const listMachines = api.wrap(api.paginate(listMachinesAsync), api.securityLaundryUser, api.securityAdministrator)
export const createMachine = api.wrap(createMachineAsync, api.securityLaundryOwner, api.securityAdministrator)
export const fetchMachine = api.wrap(fetchMachineAsync, api.securityLaundryUser, api.securityAdministrator)
export const deleteMachine = api.wrap(deleteMachineAsync, api.securityLaundryOwner, api.securityAdministrator)
export const updateMachine = api.wrap(updateMachineAsync, api.securityLaundryOwner, api.securityAdministrator)
