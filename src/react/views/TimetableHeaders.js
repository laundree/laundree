// @flow

import React from 'react'
import { FormattedDate, FormattedMessage } from 'react-intl'
import * as string from '../../utils/string'
import moment from 'moment-timezone'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import { Link } from 'react-router-dom'
import type { Laundry, Machine } from 'laundree-sdk/lib/redux'

type TimetableHeaderProps = {
  hoverColumn: number,
  laundry: Laundry,
  date: moment,
  machines: { [string]: Machine }
}

const TimetableHeader = (props: TimetableHeaderProps) => {
  const machines = props.laundry.machines
    .map(id => props.machines[id])
    .filter(m => m)
  return <div className='header_container'>
    <div className='date'>
      <FormattedDate
        weekday='short' month='numeric' day='numeric'
        value={new Date(props.date.format('YYYY-MM-DD'))}/>
    </div>
    <table className={machines.length > 5 ? 'compressed' : ''}>
      <tbody>
      <tr className='machines'>
        {machines
          .map((machine, i) => <td
            key={machine.id}
            className={machine.type + (props.hoverColumn === i ? ' hoverColumn' : '') + (machine.broken ? ' broken' : '')}>
            <svg>
              <use xlinkHref={machine.type === 'dry' ? '#Waves' : '#Drop'}/>
            </svg>
            {machine.broken ? <svg className='broken'>
              <use xlinkHref='#CloseX'/>
            </svg> : null}
          </td>)}
      </tr>
      <tr className='labels'>
        {machines
          .map((machine, i) => <td
            key={machine.id}
            className={(props.hoverColumn === i ? ' hoverColumn' : '') + (machine.broken ? ' broken' : '')}>
            <div><span className='longName'>{machine.name}</span><span
              className='shortName'>{string.shortName(machine.name)}</span></div>
          </td>)}
      </tr>
      </tbody>
    </table>
  </div>
}

class CalendarNavigationElement extends React.Component {
  props: {
    laundry: Laundry,
    dates: moment[]

  }
  state = {current: this.firstDate}

  week (mom = moment()) {
    return [
      mom.clone().day(1),
      mom.clone().day(2),
      mom.clone().day(3),
      mom.clone().day(4),
      mom.clone().day(5),
      mom.clone().day(6),
      mom.clone().day(7)
    ]
  }

  _monthBuilder (reference, date) {
    const mondayProspect = date.clone().day(1)
    const monday = mondayProspect.isSameOrBefore(date)
      ? mondayProspect
      : mondayProspect.clone().subtract(7, 'days')
    if (monday.month() > reference.month() && monday.year() === reference.year()) {
      return []
    }
    if (monday.month() < reference.month() && monday.year() > reference.year()) {
      return []
    }
    return [this.week(monday)].concat(this._monthBuilder(reference, date.clone().add(7, 'days')))
  }

  month (mom) {
    const firstDay = mom.clone().date(1)
    return this._monthBuilder(firstDay, firstDay)
  }

  header () {
    return <thead>
    <tr>
      {this.week().map(d => <th key={d.unix()}><FormattedDate weekday='narrow' value={d.toDate()}/></th>)}
    </tr>
    </thead>
  }

  generateClassName (now, day) {
    const otherMonth = this.state.current.month() !== day.month()
    const today = now.isSame(day, 'day')
    const active = day.isSameOrBefore(this.lastDate()) && day.isSameOrAfter(this.firstDate())
    const hover = this.state.hover && day.isSameOrAfter(this.state.hover.start) && day.isSameOrBefore(this.state.hover.end) ? 'hover' : ''
    return `${otherMonth ? 'otherMonth' : ''} ${today ? 'today' : ''} ${active ? 'active' : ''} ${hover ? 'hover' : ''}`
  }

  firstDate () {
    return this.props.dates[0]
  }

  lastDate () {
    return this.props.dates[this.props.dates.length - 1]
  }

  renderMonth () {
    const now = moment()
    return <tbody>
    {this
      .month(this.state.current)
      .map(week => <tr key={`${week[0].month()}-${week[0].date()}`}>
        {week.map(day => <td
          onMouseOver={() => this.setState({
            hover: {
              start: day,
              end: day.clone().add(this.props.dates.length - 1, 'days')
            }
          })}
          key={day.date()} className={this.generateClassName(now, day)}>
          <Link to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${day.format('YYYY-MM-DD')}`}>
            {day.date()}
          </Link>
        </td>)}
      </tr>)}
    </tbody>
  }

  render () {
    return <div className='calendar'>
      <nav>
        <span
          className='arrow left'
          onClick={() => this.setState(({current}) => ({current: current.clone().subtract(1, 'month')}))}/>
        <FormattedDate value={this.state.current.toDate()} month='long' year='numeric'/>
        <span
          className='arrow right'
          onClick={() => this.setState(({current}) => ({current: current.clone().add(1, 'month')}))}/>
      </nav>
      <table onMouseOut={() => this.setState({hover: null})}>
        {this.header()}
        <DropDownCloser>
          {this.renderMonth()}
        </DropDownCloser>
      </table>
    </div>
  }
}

class TimeTableHeaderNav extends React.Component {
  props: {
    laundry: Laundry,
    dates: moment[]
  }

  firstDate () {
    return this.props.dates[0]
  }

  lastDate () {
    return this.props.dates[this.props.dates.length - 1]
  }

  yesterday () {
    return this.firstDate().clone().subtract(1, 'd')
  }

  tomorrow () {
    return this.firstDate().clone().add(1, 'd')
  }

  renderTitle () {
    if (this.props.dates.length === 1) {
      return <div className='nav'>
        <svg className='today'>
          <use xlinkHref='#Calendar'/>
        </svg>
        <FormattedDate
          weekday='short' month='numeric' day='numeric'
          value={this.firstDate()}/>
      </div>
    }

    return <div className='nav'>
      <svg className='today'>
        <use xlinkHref='#Calendar'/>
      </svg>
      <FormattedMessage
        id='timetable.nav'
        values={{
          fromDate: <FormattedDate
            weekday='short' month='numeric' day='numeric'
            value={new Date(this.firstDate().format('YYYY-MM-DD'))}/>,
          toDate: <FormattedDate
            weekday='short' month='numeric' day='numeric'
            value={new Date(this.lastDate().format('YYYY-MM-DD'))}/>
        }}
      />
    </div>
  }

  render () {
    if (this.props.dates.length === 0) return null
    return <div className='timeTableHeaderNav'>
      <Link
        to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${this.yesterday().format('YYYY-MM-DD')}`}
        className='arrow left'/>
      <DropDown>
        <DropDownTitle>{this.renderTitle()}</DropDownTitle>
        <DropDownContent>
          <CalendarNavigationElement
            dates={this.props.dates}
            laundry={this.props.laundry}/>
        </DropDownContent>
      </DropDown>
      <Link
        to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${this.tomorrow().format('YYYY-MM-DD')}`}
        className='arrow right'/>
    </div>
  }
}

const TimetableHeaders = (props: { hoverColumn: number, laundry: Laundry, dates: moment[], machines: { [string]: Machine } }) => {
  const now = moment.tz(props.laundry.timezone)
  return <header
    className={props.dates.length && props.dates[0].isSameOrBefore(now, 'd') ? 'today' : undefined}>
    <div className='date_nav'>
      <FormattedMessage tagName='h1' id='timetable.title'/>
      <TimeTableHeaderNav
        laundry={props.laundry}
        dates={props.dates}/>
    </div>
    <div id='TimeTableHeader'>
      {props.dates.map((date, i) => <TimetableHeader
        hoverColumn={props.hoverColumn - (i * props.laundry.machines.length)}
        laundry={props.laundry} machines={props.machines} date={date}
        key={date}/>)}
    </div>
  </header>
}

export default TimetableHeaders
