const React = require('react')

const DropDownTitle = (props) => <div className='dropDownTitle' onClick={props.onClick}>{props.children}</div>

DropDownTitle.propTypes = {
  onClick: React.PropTypes.func,
  children: React.PropTypes.any
}

const DropDownContent = (props) => <div
  className={'dropDownContent ' + (props.className ? props.className : '')}>{props.children}</div>

DropDownContent.propTypes = {
  className: React.PropTypes.string,
  children: React.PropTypes.any
}

class DropDownCloser extends React.Component {
  constructor (props) {
    super(props)
    this.generateOnClick = (fn) => (evt) => {
      if (fn) fn(evt)
      this.context.closeDropDown()
    }
  }

  get child () {
    return React.Children.only(this.props.children)
  }

  render () {
    const child = this.child
    return React.cloneElement(this.child, {onClick: this.generateOnClick(child.props.onClick)})
  }
}

DropDownCloser.contextTypes = {
  closeDropDown: React.PropTypes.func.isRequired
}

DropDownCloser.propTypes = {
  children: React.PropTypes.any
}

class DropDown extends React.Component {

  constructor (props) {
    super(props)
    this.state = {open: false}
    this.onToggle = () => this.toggle()
    let ref

    this.refPuller = (r) => {
      ref = r
    }
    this.clickListener = (event) => {
      let target = event.target
      while (target && target.classList) {
        if (target === ref) return
        target = target.parentNode
      }
      this.close()
    }
    this.escListener = (event) => {
      if (event.keyCode !== 27) return
      this.close()
    }
  }

  getChildContext () {
    return {closeDropDown: () => this.close()}
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.clickListener)
    document.removeEventListener('keyup', this.escListener)
  }

  componentDidMount () {
    document.addEventListener('click', this.clickListener)
    document.addEventListener('keyup', this.escListener)
  }

  close () {
    this.setState({open: false})
  }

  toggle () {
    this.setState(({open}) => ({open: !open}))
  }

  render () {
    const children = React.Children.toArray(this.props.children)
    const title = children.find(i => i.type === DropDownTitle)
    if (!title) throw new Error('Drop-down title not provided')
    const content = children.find(i => i.type === DropDownContent)
    if (!content) throw new Error('Drop-down content not found')
    return <div
      ref={this.refPuller}
      className={'dropDown ' + (this.state.open ? 'open ' : '') + (this.props.className ? this.props.className : '')}>
      {React.cloneElement(title, {onClick: this.onToggle})}
      {content}
    </div>
  }
}

DropDown.childContextTypes = {
  closeDropDown: React.PropTypes.func.isRequired
}

DropDown.propTypes = {
  className: React.PropTypes.string,
  children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired
}

module.exports = {DropDown, DropDownTitle, DropDownContent, DropDownCloser}
