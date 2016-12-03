const React = require('react')
const DocumentTitle = require('react-document-title')
const {ValidationElement, ValidationForm} = require('./validation')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown.jsx')
const {Modal, Label, Input, Submit} = require('./intl')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')

class MachineDropdown extends React.Component {

  selectGenerator (value) {
    return () => {
      this.props.onSelect(value)
      return null
    }
  }

  render () {
    return <DropDown>
      <DropDownTitle>
        <svg>
          <use xlinkHref={this.props.selected === 'wash' ? '#Drop' : '#Waves'}/>
        </svg>
      </DropDownTitle>
      <DropDownContent>
        <ul className='dropDownList'>
          <DropDownCloser>
            <li className={this.props.selected === 'wash' ? 'active' : ''} onClick={this.selectGenerator('wash')}>
              <span className='link'>
                <svg>
                  <use xlinkHref='#Drop'/>
                </svg>
                <FormattedMessage id='machines.washing-machine'/>
              </span>
            </li>
          </DropDownCloser>
          <DropDownCloser>
            <li className={this.props.selected === 'dry' ? 'active' : ''} onClick={this.selectGenerator('dry')}>
              <span className='link'>
                <svg>
                  <use xlinkHref='#Waves'/>
                </svg>
                <FormattedMessage id='machines.dryer'/>
              </span>
            </li>
          </DropDownCloser>
        </ul>
      </DropDownContent>
    </DropDown>
  }
}

MachineDropdown.propTypes = {
  onSelect: React.PropTypes.func.isRequired,
  selected: React.PropTypes.string
}

class MachineListItem extends React.Component {

  constructor (props) {
    super(props)
    this.state = this.initialState

    this.onSelect = (selected) => {
      if (this.props.machine) this.props.onUpdate({type: selected})
      this.setState({selected})
    }

    this.onChange = (evt) => this.setState({value: evt.target.value, initial: false})

    this.onSubmit = (evt) => {
      evt.preventDefault()
      if (this.props.machine) return this.onUpdateName()
      this.props
        .onSubmit(this.selected, this.value)
        .then(() => this.reset())
    }

    this.onUpdateName = () => {
      if (!this.props.machine || !this.changed || this.blacklist.indexOf(this.state.value.trim()) >= 0) return
      this.props.onUpdate({name: this.state.value})
    }

    this.onCloseModal = () => this.setState({showModal: false})

    this.onDelete = () => this.setState({showModal: true})

    this.onDeleteModal = () => {
      this.onCloseModal()
      this.props.onDelete()
    }
  }

  reset () {
    this.setState(({sesh}) => Object.assign({}, this.initialState, {sesh: sesh + 1}))
  }

  componentWillReceiveProps ({machine}) {
    if (!machine) return
    this.setState({value: machine.name, selected: machine.type})
  }

  get initialState () {
    if (!this.props.machine) return {sesh: 0, value: '', selected: 'wash', initial: true}
    return {value: this.props.machine.name, selected: this.props.machine.type, initial: true}
  }

  get selected () {
    if (!this.state.selected) return 'wash'
    return this.state.selected
  }

  get value () {
    return this.state.value
  }

  get changed () {
    if (!this.props.machine) return false
    return this.props.machine.name !== this.state.value.trim()
  }

  get blacklist () {
    let blacklist = this.props.blacklist
    if (this.props.machine) blacklist = blacklist.filter((name) => name !== this.props.machine.name)
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
        className='machine_form'
        onSubmit={this.onSubmit}
        initial={this.state.initial}>
        <MachineDropdown selected={this.selected} onSelect={this.onSelect}/>
        <ValidationElement
          sesh={this.state.sesh}
          trim
          notOneOf={this.blacklist}
          value={this.value} initial={this.state.initial}>
          <Label data-validate-error='machines.error.machine-name'>
            <Input
              onBlur={this.onUpdateName}
              type='text'
              placeholder={this.selected === 'wash' ? 'machines.washing-machine-name' : 'machines.dryer-name'}
              value={this.value} onChange={this.onChange}/>
          </Label>
        </ValidationElement>
        {this.props.onDelete
          ? <div className='delete action'>
          <svg onClick={this.onDelete}>
            <use xlinkHref='#Trash'/>
          </svg>
        </div>
          : null
        }
        {this.props.children}
      </ValidationForm>
    </div>
  }
}

MachineListItem.propTypes = {
  onSubmit: React.PropTypes.func,
  onDelete: React.PropTypes.func,
  onUpdate: React.PropTypes.func,
  children: React.PropTypes.any,
  machine: React.PropTypes.object,
  blacklist: React.PropTypes.array
}

class Machines extends React.Component {

  constructor (props) {
    super(props)
    this.state = {}
    this.creator = (type, name) => sdk.laundry(this.props.currentLaundry).createMachine(name, type)
  }

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  generateDeleter (id) {
    return () => sdk.machine(id).del()
  }

  generateUpdater (id) {
    return (params) => sdk.machine(id).updateMachine(params)
  }

  componentDidMount () {
    sdk.listMachines(this.props.currentLaundry)
  }

  get blacklist () {
    return this.laundry.machines
      .map((id) => this.props.machines[id])
      .filter((m) => m)
      .map((m) => m.name)
  }

  renderMachineList () {
    const laundry = this.laundry
    if (!laundry.machines.length) {
      return <div className='empty_list'>
        <FormattedMessage id='machines.no-machines'/>
      </div>
    }
    return <ul className='machine_list'>
      {laundry.machines.map((machineId) => <li key={machineId}>
        <MachineListItem
          blacklist={this.blacklist}
          machine={this.props.machines[machineId]}
          onUpdate={this.generateUpdater(machineId)}
          onDelete={this.generateDeleter(machineId)}/>
      </li>)}
    </ul>
  }

  render () {
    return <DocumentTitle title='Machines'>
      <main className='naved' id='LaundryMain'>
        <FormattedMessage id='machines.title' tagName='h1'/>
        {this.renderMachineList()}
        <div className='create_machine'>
          <FormattedMessage id='machines.create-machine.title' tagName='h2'/>
          <MachineListItem
            blacklist={this.blacklist}
            onSubmit={this.creator}>
            <div className='buttons'>
              <Submit value='general.create'/>
            </div>
          </MachineListItem>
        </div>
      </main>
    </DocumentTitle>
  }
}

Machines.propTypes = {
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object,
  machines: React.PropTypes.object,
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}

module.exports = Machines
