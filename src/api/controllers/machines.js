// @flow

import MachineHandler from '../../handlers/machine'
import * as api from '../helper'

async function listMachinesAsync (req, res) {
  const filter = {}
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  const laundry = req.subjects.laundry
  filter.laundry = laundry.model._id
  const machines = await MachineHandler.lib.find(filter, {limit, sort: {_id: 1}})
  const summarizedMachines = machines.map((machine) => machine.toRestSummary())
  const links: { first: string, next?: string } = {
    first: `/api/laundries/${laundry.model.id}/machines?page_size=${limit}`
  }
  if (summarizedMachines.length === limit) {
    links.next = `/api/laundries/${laundry.model.id}/machines?since=${summarizedMachines[summarizedMachines.length - 1].id}&page_size=${limit}`
  }
  res.links(links)
  res.json(summarizedMachines)
}

async function createMachineAsync (req, res) {
  const body = req.swagger.params.body.value
  const name = body.name.trim()
  const type = body.type
  const broken = body.broken
  const laundry = req.subjects.laundry
  const [m] = await MachineHandler
    .lib
    .find({name: name, laundry: laundry.model._id})
  if (m) {
    return api.returnError(res, 409, 'Machine already exists', {Location: m.restUrl})
  }
  const machine = await laundry.createMachine(name, type, broken)
  api.returnSuccess(res, machine.toRest())
}

function fetchMachineAsync (req, res) {
  const machine = req.subjects.machine
  api.returnSuccess(res, machine.toRest())
}

async function deleteMachineAsync (req, res) {
  const machine = req.subjects.machine
  await req.subjects.laundry.deleteMachine(machine)
  api.returnSuccess(res)
}

async function updateMachineAsync (req, res) {
  const body = req.swagger.params.body.value
  const name = body.name ? body.name.trim() : undefined
  const type = body.type
  const broken = body.broken
  const {machine, laundry} = req.subjects
  const [m] = await MachineHandler
    .lib
    .find({name, laundry: laundry.model._id})
  if (m && m.model.id !== machine.model.id) {
    return api.returnError(res, 409, 'Machine already exists', {Location: machine.restUrl})
  }
  await machine.update({name, type, broken})
  api.returnSuccess(res, machine.toRest())
}

export const listMachines = api.wrapErrorHandler(listMachinesAsync)
export const createMachine = api.wrapErrorHandler(createMachineAsync)
export const fetchMachine = api.wrapErrorHandler(fetchMachineAsync)
export const deleteMachine = api.wrapErrorHandler(deleteMachineAsync)
export const updateMachine = api.wrapErrorHandler(updateMachineAsync)
