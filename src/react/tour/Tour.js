import React from 'react'

export default class Tour extends React.PureComponent<{ children: *, onClose: () => * }> {

  _buttonStyle = {
    display: 'block',
    width: '100%',
    padding: '1em 0'
  }

  render () {
    const children = React.Children.toArray(this.props.children)
    if (!children.length) {
      return null
    }
    const {step} = children
      .map((child, step) => ({child, step}))
      .find(({child}) => !child.props.completed)
    return (
      <div>
        <ul style={{listStyleType: 'none'}}>
          {children.map((child, i) => (
            <li key={i} style={{padding: '1em 1em'}}>
              {i === step
                ? (
                  <div>
                    <div>
                      <span style={{fontWeight: 'bold'}}>
                        {i + 1}. {child.props.title}
                      </span>
                    </div>
                    {child}
                  </div>)
                : (
                  <div>
                    <span style={{fontStyle: 'italic'}}>
                      {i + 1}. {child.props.title}
                      {child.props.completed && i < step
                        ? (
                          <svg style={{fill: '#03414C', width: '1em', height: '1em', paddingLeft: '0.5em'}}>
                            <use xlinkHref={'#MediaCheckmark'} />
                          </svg>)
                        : null}
                    </span>
                  </div>
                )}
            </li>
          ))}
        </ul>
        <div style={{position: 'absolute', bottom: 0, width: '100%'}}>
          <div style={{padding: '1em 2em', textAlign: 'center'}}>
            Step {step + 1} of {children.length}
          </div>
          <div style={{
            height: '0.2em',
            backgroundColor: '#befffe',
            width: `${((step + 1) / children.length) * 100}%`
          }} />
          <div>
            <button
              onClick={this.props.onClose}
              style={this._buttonStyle}
              className={'red'}>
              Stop tour
            </button>
          </div>
        </div>
      </div>
    )
  }
}
