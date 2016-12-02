const React = require('react')
const DocumentTitle = require('react-document-title')
const {ValidationElement, ValidationForm} = require('./validation')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown.jsx')
const {Modal} = require('./modal')
const sdk = require('../../client/sdk')

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
                Washing machine
              </span>
            </li>
          </DropDownCloser>
          <DropDownCloser>
            <li className={this.props.selected === 'dry' ? 'active' : ''} onClick={this.selectGenerator('dry')}>
              <span className='link'>
                <svg>
                  <use xlinkHref='#Waves'/>
                </svg>
                Dryer
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
    var blacklist = this.props.blacklist
    if (this.props.machine) blacklist = blacklist.filter((name) => name !== this.props.machine.name)
    return blacklist.concat([''])
  }

  render () {
    return <div>
      <Modal
        show={this.state.showModal}
        message='Are you sure that you want to delete this machine?'
        onClose={this.onCloseModal}
        actions={[
          {label: 'Delete', className: 'delete red', action: this.onDeleteModal},
          {label: 'Cancel', className: 'cancel', action: this.onCloseModal}]}
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
          <label data-validate-error='Please enter a unique machine name'>
            <input
              onBlur={this.onUpdateName}
              type='text'
              placeholder={this.selected === 'wash' ? 'Washing machine name' : 'Dryer name'}
              value={this.value} onChange={this.onChange}/>
          </label>
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
      </ValidationForm></div>
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

  render () {
    const laundry = this.props.laundries[this.props.currentLaundry]
    const blacklist = laundry.machines
      .map((id) => this.props.machines[id])
      .filter((m) => m)
      .map((m) => m.name)
    return <DocumentTitle title='Machines'>
      <main className='naved' id='LaundryMain'>
        <h1>Machines</h1>
        {laundry.machines.length
          ? <ul className='machine_list'>
          {laundry.machines.map((machineId) => <li key={machineId}>
            <MachineListItem
              blacklist={blacklist}
              machine={this.props.machines[machineId]}
              onUpdate={this.generateUpdater(machineId)}
              onDelete={this.generateDeleter(machineId)}/>
          </li>)}
        </ul>
          : <div className='empty_list'><span>There are no machines registered to this laundry</span></div>}
        <div className='create_machine'>
          <h2>Create machine</h2>
          <MachineListItem
            blacklist={blacklist}
            onSubmit={this.creator}>
            <div className='buttons'>
              <input type='submit' value='Create'/>
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
