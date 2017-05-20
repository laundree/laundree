/**
 * Created by budde on 09/06/16.
 */

import MachineHandler from '../../handlers/machine'
import {api} from '../../utils'

function listMachines (req, res) {
  const filter = {}
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  if (since) {
    filter._id = {$gt: since}
  }
  const laundry = req.subjects.laundry
  filter.laundry = laundry.model._id
  return MachineHandler.lib.find(filter, {limit, sort: {_id: 1}})
    .then((machines) => machines.map((machine) => machine.toRestSummary()))
    .then((machines) => {
      const links = {
        first: `/api/laundries/${laundry.model.id}/machines?page_size=${limit}`
      }
      if (machines.length === limit) {
        links.next = `/api/laundries/${laundry.model.id}/machines?since=${machines[machines.length - 1].id}&page_size=${limit}`
      }
      res.links(links)
      res.json(machines)
    })
    .catch(api.generateErrorHandler(res))
}

function createMachine (req, res) {
  const body = req.swagger.params.body.value
  const name = body.name.trim()
  const type = body.type
  const broken = body.broken
  const laundry = req.subjects.laundry
  return MachineHandler
    .lib
    .find({name: name, laundry: laundry.model._id})
    .then(([machine]) => {
      if (machine) return api.returnError(res, 409, 'Machine already exists', {Location: machine.restUrl})
      return laundry.createMachine(name, type, broken)
        .then((machine) => api.returnSuccess(res, machine.toRest()))
    })
    .catch(api.generateErrorHandler(res))
}

function fetchMachine (req, res) {
  const machine = req.subjects.machine
  api.returnSuccess(res, machine.toRest())
}

function deleteMachine (req, res) {
  const machine = req.subjects.machine
  req.subjects.laundry.deleteMachine(machine)
    .then(() => api.returnSuccess(res))
    .catch(api.generateErrorHandler(res))
}

function updateMachine (req, res) {
  const body = req.swagger.params.body.value
  const name = body.name ? body.name.trim() : undefined
  const type = body.type
  const broken = body.broken
  const {machine, laundry} = req.subjects
  return MachineHandler
    .find({name, laundry: laundry.model._id})
    .then(([m]) => {
      if (m && m.model.id !== machine.model.id) return api.returnError(res, 409, 'Machine already exists', {Location: machine.restUrl})
      machine.update({name, type, broken}).then(() => api.returnSuccess(res, machine.toRest()))
    })
    .catch(api.generateErrorHandler(res))
}

module.exports = {
  listMachines,
  createMachine,
  fetchMachine,
  deleteMachine,
  updateMachine
}
