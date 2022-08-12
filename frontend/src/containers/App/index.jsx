import React from 'react'
import { Routes, Route } from 'react-router-dom'

import { useSelector } from "react-redux"
import { getUser } from '@storage/session'

import MainSideNav from '@components/MainSideNav'
import Header from '@components/Header'
import MessageHub from '@components/MessageHub'
import Login from '@containers/Login'
import Courses from '@containers/Courses'
import Users from '@containers/Users'

import './style.css'

export default () => {
  const currUser = useSelector(getUser)

  return (
    <React.Fragment>
      <MessageHub />
      <MainSideNav currUser={currUser} />
      <Header currUser={currUser} />
      <Routes>
        <Route exact path='/' element={currUser
          ? (<Courses />)
          : (<Login />) }
        />
        <Route exact path='/courses' element={<Courses />} />
        <Route exact path='/users' element={<Users />} />
      </Routes>
    </React.Fragment>
  )
}
