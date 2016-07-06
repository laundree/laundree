/**
 * Created by budde on 09/06/16.
 */

const {MachineHandler, LaundryHandler} = require('../../handlers')
const {api} = require('../../utils')

function listMachines (req, res) {
  const filter = {}
  const limit = req.swagger.params.page_size.value
  const since = req.swagger.params.since.value
  const id = req.swagger.params.id.value
  if (since) {
    filter._id = {$gt: since}
  }
  LaundryHandler.findFromId(id).then((laundry) => {
    if (!laundry || !laundry.isUser(req.user)) return api.returnError(res, 404, 'Laundry not found')
    filter.laundry = laundry.model._id
    return MachineHandler.find(filter, {limit, sort: {_id: 1}})
      .then((machines) => machines.map((machine) => machine.toRestSummary()))
      .then((machines) => {
        var links = {
          first: `/api/laundries/${laundry.model.id}/machines?page_size=${limit}`
        }
        if (machines.length === limit) {
          links.next = `/api/laundries/${laundry.model.id}/machines?since=${machines[machines.length - 1].id}&page_size=${limit}`
        }
        res.links(links)
        res.json(machines)
      })
  }).catch(api.generateErrorHandler(res))
}

function createMachine (req, res) {
  const body = req.swagger.params.body.value
  const name = body.name.trim()
  const type = body.type
  const id = req.swagger.params.id.value
  LaundryHandler.findFromId(id)
    .then((laundry) => {
      if (!laundry || !laundry.isUser(req.user)) return api.returnError(res, 404, 'Laundry not found')
      if (!laundry.isOwner(req.user)) return api.returnError(res, 403, 'Not allowed')
      return MachineHandler
        .find({name: name, laundry: laundry.model._id})
        .then(([machine]) => {
          if (machine) return api.returnError(res, 409, 'Machine already exists', {Location: machine.restUrl})
          return laundry.createMachine(name, type)
            .then((machine) => api.returnSuccess(res, machine.toRest()))
        })
    })
    .catch(api.generateErrorHandler(res))
}

function fetchMachine (req, res) {
  const id = req.swagger.params.id.value
  MachineHandler.findFromId(id)
    .then((machine) => {
      if (!machine) return api.returnError(res, 404, 'Machine not found')
      return machine.fetchLaundry()
        .then((laundry) => ({machine: machine, laundry: laundry}))
        .then(({machine, laundry}) => {
          if (!laundry || !laundry.isUser(req.user)) return api.returnError(res, 404, 'Machine not found')
          api.returnSuccess(res, machine.toRest())
        })
    })
    .catch(api.generateErrorHandler(res))
}

function deleteMachine (req, res) {
  const id = req.swagger.params.id.value
  MachineHandler.findFromId(id)
    .then((machine) => {
      if (!machine) return api.returnError(res, 404, 'Machine not found')
      return machine.fetchLaundry()
        .then((laundry) => ({machine: machine, laundry: laundry}))
        .then(({machine, laundry}) => {
          if (!laundry || !laundry.isUser(req.user)) return api.returnError(res, 404, 'Machine not found')
          if (!laundry.isOwner(req.user)) return api.returnError(res, 403, 'Not allowed')
          laundry.deleteMachine(machine).then(() => api.returnSuccess(res))
        })
    })
    .catch(api.generateErrorHandler(res))
}

function updateMachine (req, res) {
  const body = req.swagger.params.body.value
  const name = body.name ? body.name.trim() : undefined
  const type = body.type
  const id = req.swagger.params.id.value
  MachineHandler.findFromId(id)
    .then((machine) => {
      if (!machine) return api.returnError(res, 404, 'Machine not found')
      return machine.fetchLaundry()
        .then((laundry) => ({machine: machine, laundry: laundry}))
        .then(({machine, laundry}) => {
          if (!laundry || !laundry.isUser(req.user)) return api.returnError(res, 404, 'Machine not found')
          if (!laundry.isOwner(req.user)) return api.returnError(res, 403, 'Not allowed')
          return MachineHandler.find({name, laundry: laundry.model._id}).then(([m]) => {
            if (m && m.model.id !== machine.model.id) return api.returnError(res, 409, 'Machine already exists', {Location: machine.restUrl})
            machine.update({name, type}).then(() => api.returnSuccess(res, machine.toRest()))
          })
        })
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
