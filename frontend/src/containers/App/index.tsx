import React from 'react'
import { Routes, Route } from 'react-router-dom'

import { useAppSelector, SessionActions } from '@storage'

import MainSideNav from '@components/MainSideNav'
import Header from '@components/Header'
import MessageHub from '@components/MessageHub'
import Login from '@containers/Login'
import Users from '@containers/Users'
import Media from '@containers/Media'
import Empty from '@containers/Empty'

import './style.css'

export default () => {
  const currUser = useAppSelector(SessionActions.getUser)

  return (
    <React.Fragment>
      <MessageHub />
      <MainSideNav currUser={currUser} />
      <Header currUser={currUser} />
      <Routes>
        <Route path='/' element={currUser
          ? (<Empty />)
          : (<Login />) }
        />
        <Route path='/users' element={<Users />} />
        <Route path='/media' element={<Media />} />
      </Routes>
    </React.Fragment>
  )
}
