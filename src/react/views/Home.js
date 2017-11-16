// @flow
import React from 'react'
import AdminPanel from './AdminPanel'
import CreateLaundry from './CreateLaundry'
import { Redirect } from 'react-router'
import type { User } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'

const Home = ({user}: { user: ?User }) => {
  if (!user) throw new Error('User not found')
  if (user.role === 'admin') return <AdminPanel />
  if (!user.laundries.length) return <CreateLaundry />
  return <Redirect to={`/laundries/${user.laundries[0]}/timetable`} />
}

export default connect(({users, currentUser}): { user: ?User } => ({user: (currentUser && users[currentUser]) || null}))(Home)
