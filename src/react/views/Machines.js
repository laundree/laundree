// @flow
import React from 'react'
import { ValidationElement, ValidationForm } from './validation'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import { Meta, Modal, Label, Input, Submit } from './intl'
import sdk from '../../client/sdk'
import { FormattedMessage } from 'react-intl'
import Loader from './Loader'
import type { State, Machine, Laundry, User } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'
import ReactGA from 'react-ga'

class MachineDropdown extends React.Component<{
  onSelect: Function,
  selected: string
}> {
  selectGenerator (value) {
    return () => {
      this.props.onSelect(value)
      return null
    }
  }

  render () {
    return (
      <DropDown>
        <DropDownTitle>
          <svg>
            <use xlinkHref={this.props.selected === 'wash' ? '#Drop' : '#Waves'} />
          </svg>
        </DropDownTitle>
        <DropDownContent>
          <ul className='dropDownList'>
            <DropDownCloser>
              <li className={this.props.selected === 'wash' ? 'active' : ''} onClick={this.selectGenerator('wash')}>
              <span className='link'>
                <svg>
                  <use xlinkHref='#Drop' />
                </svg>
                <FormattedMessage id='machines.washing-machine' />
              </span>
              </li>
            </DropDownCloser>
            <DropDownCloser>
              <li className={this.props.selected === 'dry' ? 'active' : ''} onClick={this.selectGenerator('dry')}>
              <span className='link'>
                <svg>
                  <use xlinkHref='#Waves' />
                </svg>
                <FormattedMessage id='machines.dryer' />
              </span>
              </li>
            </DropDownCloser>
          </ul>
        </DropDownContent>
      </DropDown>)
  }
}

type MachineListItemProps = {
  onSubmit: Function,
  onDelete: Function,
  onRepair: Function,
  onUpdate: Function,
  machine?: Machine,
  blacklist: string[],
  children?: *
}

type MachineListItemState = { sesh: number, value: string, selected: 'wash' | 'dry', initial: boolean, broken: boolean, showModal: boolean }

class MachineListItem extends React.Component<MachineListItemProps, MachineListItemState> {

  state = this.initialState()

  onSelect = (selected) => {
    if (this.props.machine) this.props.onUpdate({type: selected})
    this.setState({selected})
  }

  onChange = evt => this.setState({value: evt.target.value, initial: false})

  onSubmit = evt => {
    evt.preventDefault()
    if (this.props.machine) return this.onUpdateName()
    this.props
      .onSubmit(this.selected(), this.value(), this.broken())
      .then(() => this.reset())
  }

  onUpdateName = () => {
    if (!this.props.machine || !this.changed() || this.blacklist().indexOf(this.state.value.trim()) >= 0) return
    this.props.onUpdate({name: this.state.value})
  }

  onCloseModal = () => this.setState({showModal: false})

  onDelete = () => this.setState({showModal: true})

  onDeleteModal = () => {
    this.onCloseModal()
    this.props.onDelete()
  }

  reset () {
    this.setState(({sesh}) => Object.assign({}, this.initialState(), {sesh: sesh + 1}))
  }

  componentWillReceiveProps ({machine}) {
    if (!machine) return
    this.setState({value: machine.name, selected: machine.type})
  }

  initialState () {
    if (!this.props.machine) {
      return {
        sesh: 0,
        value: '',
        selected: 'wash',
        initial: true,
        broken: false,
        showModal: false
      }
    }
    return {
      sesh: 0,
      showModal: false,
      value: this.props.machine.name,
      selected: this.props.machine.type,
      broken: this.props.machine.broken,
      initial: true
    }
  }

  selected () {
    if (!this.state.selected) return 'wash'
    return this.state.selected
  }

  value () {
    return this.state.value
  }

  broken () {
    return Boolean(this.props.machine && this.props.machine.broken)
  }

  changed () {
    if (!this.props.machine) return false
    return this.props.machine.name !== this.state.value.trim()
  }

  blacklist () {
    let blacklist = this.props.blacklist
    const machine = this.props.machine
    if (machine) {
      blacklist = blacklist.filter((name) => name !== machine.name)
    }
    return blacklist.concat([''])
  }

  render () {
    return <div>
      <Modal
        show={this.state.showModal}
        message='machines.modal.message'
        onClose={this.onCloseModal}
        actions={[
          {label: 'general.delete', className: 'delete red', action: this.onDeleteModal},
          {label: 'general.cancel', className: 'cancel', action: this.onCloseModal}]}
      />
      <ValidationForm
        sesh={this.state.sesh}
        className={'machineForm ' + (this.broken() ? 'broken' : '')}
        onSubmit={this.onSubmit}
        initial={this.state.initial}>
        <MachineDropdown selected={this.selected()} onSelect={this.onSelect} />
        <ValidationElement
          sesh={this.state.sesh}
          trim
          notOneOf={this.blacklist()}
          value={this.value()} initial={this.state.initial}>
          <Label data-validate-error='machines.error.machine-name'>
            <Input
              onBlur={this.onUpdateName}
              type='text'
              placeholder={this.selected() === 'wash' ? 'machines.washing-machine-name' : 'machines.dryer-name'}
              value={this.value()} onChange={this.onChange} />
          </Label>
        </ValidationElement>
        {this.props.onDelete
          ? <div className='delete action'>
            <svg onClick={this.onDelete}>
              <use xlinkHref='#Trash' />
            </svg>
          </div>
          : null
        }
        {this.props.onUpdate
          ? <div className='repair action'>
            <svg onClick={() => this.props.onUpdate({broken: !this.broken()})}>
              <use xlinkHref={this.broken() ? '#MediaWrenchX' : '#MediaWrenchCheck'} />
            </svg>
          </div>
          : null}
        {this.props.children}
      </ValidationForm>
    </div>
  }
}

type MachinesProps = {
  currentLaundry: ?string,
  user: ?User,
  machines: { [string]: Machine },
  laundries: { [string]: Laundry }

}

class Machines extends React.Component<MachinesProps, {}> {
  state = {}

  creator (currentLaundry: string) {
    return (type: 'wash' | 'dry', name: string, broken: boolean) => sdk.api.laundry.createMachine(currentLaundry, {
      name,
      type,
      broken
    })
  }

  load (currentLaundry: string) {
    return sdk.listMachines(currentLaundry)
  }

  blacklist (laundry: string) {
    const l = this.props.laundries[laundry]
    if (!l) return []
    return l.machines
      .map((id) => this.props.machines[id])
      .filter((m) => m)
      .map((m) => m.name)
  }

  renderMachineList (laundry: string) {
    const l = this.props.laundries[laundry]
    if (!l) return null
    if (!l.machines.length) {
      return <div className='empty_list'>
        <FormattedMessage id='machines.no-machines' />
      </div>
    }
    return <ul className='machine_list'>
      {l.machines.map((machineId) => <li key={machineId}>
        <MachineListItem
          onSubmit={() => {}}
          onRepair={() => {}}
          blacklist={this.blacklist(laundry)}
          machine={this.props.machines[machineId]}
          onUpdate={async params => {
            await sdk.api.machine.updateMachine(machineId, params)
            ReactGA.event({category: 'Machine', action: 'Update machine'})
          }}
          onDelete={async () => {
            await sdk.api.machine.del(machineId)
            ReactGA.event({category: 'Machine', action: 'Delete machine'})
          }} />
      </li>)}
    </ul>
  }

  render () {
    const currentLaundry = this.props.currentLaundry
    if (!currentLaundry) return null
    return (
      <Loader loader={() => this.load(currentLaundry)}>
        <main className='naved' id='LaundryMain'>
          <Meta title={'document-title.machines'} />
          <FormattedMessage id='machines.title' tagName='h1' />
          {this.renderMachineList(currentLaundry)}
          <div className='create_machine'>
            <FormattedMessage id='machines.create-machine.title' tagName='h2' />
            <MachineListItem
              onRepair={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
              blacklist={this.blacklist(currentLaundry)}
              onSubmit={this.creator(currentLaundry)}>
              <div className='buttons'>
                <Submit value='general.create' />
              </div>
            </MachineListItem>
          </div>
        </main>
      </Loader>)
  }
}

export default connect(({users, currentUser, laundries, machines}: State, {match: {params: {laundryId}}}): MachinesProps => ({
  user: (currentUser && users[currentUser]) || null,
  laundries,
  machines,
  currentLaundry: laundryId
}))(Machines)
