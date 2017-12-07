import React from 'react'

type TourStepProps = {
  completed?: boolean,
  children?: *,
  title: string,
}

export default class TourStep extends React.PureComponent<TourStepProps> {
  _renderContent () {
    if (this.props.children) {
      return this.props.children
    }
    const {onPrev, onNext, render} = this.props
    if (!onPrev || !onNext || !render) return null
    return render({onPrev, onNext})
  }

  render () {
    return (
      <div>{this._renderContent()}</div>
    )
  }
}
