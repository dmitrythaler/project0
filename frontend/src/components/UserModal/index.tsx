import { useState, useEffect } from 'react'
import { timeString } from '@common'
import Modal from '@components/Modal'
import type { User } from '@p0/dal'
import './style.css'

//  ---------------------------------

type Validate = {
  email?: boolean
  lastName?: boolean
  firstName?: boolean
  password?: boolean
}

export default ({ visible, onClose, onSave, user, adminMode }) => {

  const [currUser, setCurrUser] = useState({} as User.Self)
  const [validationError, setValidationError] = useState({})

  useEffect(() => {
    setCurrUser(user || {})
  }, [user])

  const update = user && user._id

  const onChange = e => {
    setCurrUser({
      ...currUser,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const validateBeforeSave = () => {
    let error = false
    const ve = {} as Validate
    if (!currUser.email) {
      ve.email = true
      error = true
    }
    if (!currUser.lastName) {
      ve.lastName = true
      error = true
    }
    if (!currUser.firstName) {
      ve.firstName = true
      error = true
    }
    if (update) {
      // in update the empty password means don't change
      if (currUser.password && currUser.password.length < 8) {
        ve.password = true
        error = true
      }
    } else {
      if (!currUser.password || currUser.password.length < 8) {
        ve.password = true
        error = true
      }
    }

    if (!error) {
      onSave(currUser)
    } else {
      setValidationError(ve)
      setTimeout(() => {
        setValidationError({})
      }, 700)

    }
  }

  const hasError = (prop) => (validationError[prop] && 'error') || ''

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} header={(update ? 'Update' : 'Create') + ' User'}
      buttons={[
        { caption: (update ? 'Update' : 'Create'), className: 'btn-accent', onClick: () => validateBeforeSave() },
        { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
      ]}>

      <form>
        <div className="grid gap-4 lg:grid-cols-4 mb-4">
          <div className="lg:col-span-2">
            <label htmlFor="firstName" className="">First Name</label>
            <input type="text" id="firstName" name="firstName" onChange={onChange} value={currUser.firstName}
              className={`app-input ${hasError('firstName')}`} placeholder="* Required! User's first name"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="lastName" className="">Last Name</label>
            <input type="text" id="lastName" name="lastName" onChange={onChange} value={currUser.lastName}
              className={`app-input ${hasError('lastName')}`} placeholder="* Required! User's last name"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4 mb-4">
          <div className="lg:col-span-2">
            <label htmlFor="email" className="">Email</label>
            <input type="text" id="email" name="email" onChange={onChange} value={currUser.email}
              className={`app-input ${hasError('email')}`} placeholder="* Required! User's email"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="password" className="">Password</label>
            <input type="password" id="password" name="password" onChange={onChange} value={currUser.password} autoComplete="new-password"
              className={`app-input ${hasError('password')}`} placeholder={update ? 'leave blank to not change' : '* Required! User\'s password'}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12 mb-4">

          <div className="lg:col-span-6" >
            <label htmlFor="lastLogin" className="">Last Login</label>
            <input type="text" id="lastLogin" name="lastLogin" value={timeString(currUser.lastLogin, 'never')}
              className="app-input disabled" disabled
            />
          </div>

          {adminMode ? (
            <>
              <div className="lg:col-span-5">
                <label htmlFor="role" className="">Role</label>
                <select id="role" name="role" className="app-select" onChange={onChange} value={currUser.role} >
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div className="lg:col-span-1">
                <div className="w-full">
                  <label htmlFor="isActive" className="">Active</label>
                </div>
                <div className="w-full flex justify-center items-center h-10">
                  <input id="isActive" name="isActive" type="checkbox" onChange={onChange} checked={currUser.isActive}
                    className="w-6 h-6 mx-auto"
                  />
                </div>
              </div>
            </>
          ) : null}

        </div>
      </form>

    </Modal>
  )
}
