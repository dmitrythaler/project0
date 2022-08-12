import React, { useState } from 'react'
import { useDispatch } from "react-redux"

import UserModal from '@components/UserModal'
import InfoModal from '@components/InfoModal'
import ConfigModal from '@components/ConfigModal'

import { updateUser } from '@storage/user'
import { logoutUser } from '@storage/session'

import { ReactComponent as InfoIcon } from '@assets/feather.inline.icons/info.svg'
import { ReactComponent as IdIcon } from '@assets/feather.inline.icons/user-check.svg'
import { ReactComponent as LogoutIcon } from '@assets/feather.inline.icons/log-out.svg'
import { ReactComponent as ConfigIcon } from '@assets/feather.inline.icons/sliders.svg'

import './style.css'

//  ---------------------------------

export default ({ currUser }) => {

  const [userModalVisible, showUserModal] = useState(false)
  const [infoModalVisible, showInfoModal] = useState(false)
  const [configModalVisible, showConfigModal] = useState(false)
  const dispatch = useDispatch()

  const onUserSave = (dataFromModal) => {
    showUserModal(false)
    dispatch(updateUser(dataFromModal))
  }

  return (
    <React.Fragment>
      <div className="border-b border-accent flex flex-ro justify-between items-end pb-1 h-14">
        <div>
          <h1 className="font-bold text-3xl">Project Zero v0</h1>
        </div>
        {currUser ? (
          <div>
            <InfoIcon className="icon w-12 h-12 p-1 inline-block hover:bg-accent hover:text-accent-text cursor-pointer"
              onClick={e => showInfoModal(true)}
            />
            <IdIcon className="icon hover:bg-accent hover:text-accent-text inline-block w-12 h-12 p-1 ml-2 cursor-pointer"
              onClick={e => showUserModal(true)}
            />

            <ConfigIcon className="icon hover:bg-accent hover:text-accent-text inline-block w-12 h-12 p-1 ml-2 cursor-pointer"
              onClick={() => showConfigModal(true)}
            />

            <LogoutIcon className="icon hover:bg-accent hover:text-accent-text inline-block w-12 h-12 p-1 ml-2 cursor-pointer"
              onClick={e => dispatch(logoutUser())}
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

          <ConfigModal
            visible={configModalVisible}
            onClose={() => showConfigModal(false)}
          />
        </>
      ) : null }

    </React.Fragment>
  )
}
