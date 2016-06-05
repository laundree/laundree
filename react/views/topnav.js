/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Link} = require('react-router')

class TopNav extends React.Component {

  constructor (props) {
    super(props)
    this.state = {open: false}
    this.clickListener = (event) => {
      var target = event.target
      while (target && target.classList) {
        if (target.classList.contains('dropdown')) return
        target = target.parentNode
      }
      this.setState({open: false})
    }
    this.escListener = (event) => {
      if (event.keyCode !== 27) return
      this.setState({open: false})
    }
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.clickListener)
    document.removeEventListener('keyup', this.escListener)
  }

  componentDidMount () {
    document.addEventListener('click', this.clickListener)
    document.addEventListener('keyup', this.escListener)
  }

  render () {
    const clickHandler = () => this.setState({open: !this.state.open})
    return <nav id='TopNav'>
      <Link to='/app' className='home' activeClassName='active'>
        <svg>
          <use xlinkHref='#SmallLogo'/>
        </svg>
      </Link>

      <div className={'user dropdown ' + (this.state.open ? 'open' : '')}>
        <img src={this.props.user.photo} className='avatar' onClick={clickHandler}/>
        <div className='dropdown-content'>
          <ul>
            <li>
              <Link to={'/app/accounts/' + this.props.user.id} onClick={clickHandler}>
                Manage your account
              </Link>
            </li>
            <li>
              <a href='/logout'>
                Log out
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  }
}
TopNav.propTypes = {
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}

module.exports = TopNav
