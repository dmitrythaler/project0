import React, { useState } from 'react'
import { useAppDispatch, SessionState } from '@storage'

import './style.css'

//  ---------------------------------

export default () => {

  const dispatch = useAppDispatch()
  const [creds, setCreds] = useState({ password: '', email: '' })
  const [validationError, setValidationError] = useState({})

  //  ---------------------------------
  //  handlers

  const onChange = e => {
    setCreds({
      ...creds,
      [e.target.name]: e.target.value
    })
  }

  const onLogin = () => {
    let error = false
    const ve: { email?: boolean, password?: boolean } = {}
    if (!creds.email) {
      ve.email = true
      error = true
    }
    if (!creds.password) {
      ve.password = true
      error = true
    }

    if (!error) {
      dispatch(SessionState.loginUser(creds))
    } else {
      setValidationError(ve)
      setTimeout(() => {
        setValidationError({})
      }, 700)

    }
  }

  //  ---------------------------------

  const hasError = (prop) => (validationError[prop] && 'error') || ''

  return (
    <React.Fragment>

      <div className="flex justify-center items-center w-full h-screen absolute top-0 left-0">
        <div className="login-main" onClick={e => e.stopPropagation()}>

          <div className="login-header">
            <div className="ml-4 text-2xl font-bold">Login</div>
          </div>

          <div className="login-body">
            <div className="mb-4">
              <label htmlFor="email" className="pl-4">Email</label>
              <input type="text" id="email" name="email" onChange={onChange} value={creds.email}
                className={`app-input ${hasError('email')}`}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="pl-4">Password</label>
              <input type="password" id="password" name="password" onChange={onChange} value={creds.password}
                className={`app-input ${hasError('password')}`}
              />
            </div>
          </div>

          <div className="login-footer">
            <button type="button" className="btn btn-accent" onClick={onLogin}>Login</button>
          </div>
        </div>
      </div>

    </React.Fragment>
  )
}
