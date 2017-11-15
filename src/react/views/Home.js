// @flow
import React from 'react'
import AdminPanel from '../containers/AdminPanel'
import CreateLaundry from '../containers/CreateLaundry'
import { Redirect } from 'react-router'
import type { User } from 'laundree-sdk/lib/redux'
import type { LocaleType } from '../../locales'

const Home = ({users, currentUser, locale}: { locale: LocaleType, users: { [string]: User }, currentUser: string }) => {
  const user = users[currentUser]
  if (user.role === 'admin') return <AdminPanel locale={locale} />
  if (!user.laundries.length) return <CreateLaundry />
  return <Redirect to={`/${locale}/laundries/${user.laundries[0]}/timetable`} />
}

export default Home
