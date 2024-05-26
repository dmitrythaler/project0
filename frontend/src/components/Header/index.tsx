import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { UsersState, SessionState, useAppDispatch, MessagesState } from '@storage'
import UserModal from '@components/UserModal'
import InfoModal from '@components/InfoModal'

// @ts-ignore
import InfoIcon from '../../assets/feather.inline.icons/info.svg'
// @ts-ignore
import IdIcon from '../../assets/feather.inline.icons/user-check.svg'
// @ts-ignore
import LogoutIcon from '../../assets/feather.inline.icons/log-out.svg'

import './style.css'

//  ---------------------------------

export default ({ currUser }) => {

  const [userModalVisible, showUserModal] = useState(false)
  const [infoModalVisible, showInfoModal] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const onUserSave = (dataFromModal) => {
    showUserModal(false)
    dispatch(UsersState.updateUserAction(dataFromModal))
  }

  const onLogout = () => {
    dispatch(SessionState.logoutUser())
    dispatch(MessagesState.sendMessage({
      header: 'Bye...',
      body: 'You are logged out.',
      timeout: 5
    }))
    navigate('/')
  }

  return (
    <React.Fragment>
      <div className="border-b border-accent flex flex-ro justify-between items-end pb-1 h-14">
        <div>
          <h1 className="font-bold text-3xl">Project0 v0</h1>
        </div>
        {currUser ? (
          <div>
            <InfoIcon className="icon w-12 h-12 p-1 inline-block hover:bg-accent hover:text-accent-text cursor-pointer"
              onClick={e => showInfoModal(true)}
            />
            <IdIcon className="icon hover:bg-accent hover:text-accent-text inline-block w-12 h-12 p-1 ml-2 cursor-pointer"
              onClick={e => showUserModal(true)}
            />

            <LogoutIcon className="icon hover:bg-accent hover:text-accent-text inline-block w-12 h-12 p-1 ml-2 cursor-pointer"
              onClick={onLogout}
            />

          </div>
        ) : null}
      </div>

      {currUser ? (
        <>
          <UserModal
            visible={userModalVisible}
            onClose={() => showUserModal(false)}
            onSave={onUserSave}
            user={currUser}
            adminMode={false}
          />

          <InfoModal
            visible={infoModalVisible}
            onClose={() => showInfoModal(false)}
          />
        </>
      ) : null }

    </React.Fragment>
  )
}
