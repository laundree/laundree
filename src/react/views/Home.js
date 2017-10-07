// @flow
import React from 'react'
import AdminPanel from '../containers/AdminPanel'
import CreateLaundry from '../containers/CreateLaundry'
import { Redirect } from 'react-router'
import type { User } from 'laundree-sdk/lib/redux'

const Home = ({users, currentUser}: { users: { [string]: User }, currentUser: string }) => {
  const user = users[currentUser]
  if (user.role === 'admin') return <AdminPanel />
  if (!user.laundries.length) return <CreateLaundry />
  return <Redirect to={`/laundries/${user.laundries[0]}/timetable`} />
}

export default Home
