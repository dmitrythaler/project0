import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppSelector, useAppDispatch, SessionActions, UsersActions } from '@storage'
import UsersTable from '@components/UsersTable'
import UserModal from '@components/UserModal'
import Modal from '@components/Modal'

import type { User } from '@p0/dal'

// @ts-ignore
import PlusIcon from '../../assets/feather.inline.icons/plus-square.svg'
// @ts-ignore
import RefreshIcon from '../../assets/feather.inline.icons/refresh-cw.svg'

 //  ---------------------------------

const defaultUser = (): User.Self => ({
  _id: '',
  email: '',
  lastName: '',
  firstName: '',
  password: '',
  isActive: true,
  role: 'User',
  createdAt: new Date(),
  updatedAt: null,
  lastLogin: null
})

 //  ---------------------------------

 export default () => {

  const [userModalVisible, showUserModal] = useState(false)
  const [deleteDialogVisible, showDeleteDialog] = useState(false)
  const [user, setUser] = useState(defaultUser())

  const dispatch = useAppDispatch()

  const usersLoading = useAppSelector(UsersActions.isProcessing)
  const users = useAppSelector(UsersActions.getUsers)

  const currUser = useAppSelector(SessionActions.getUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (!currUser || currUser.role !== 'Admin') {
      navigate('/')
    }
  }, [currUser])

  useEffect(() => {
    if (currUser && currUser.role === 'Admin') {
      dispatch(UsersActions.fetchUsersAction())
    }
  }, [])

  //  ---------------------------------

  const onAction = (e, action, dataFromTable) => {
    setUser(dataFromTable)
    if (action === 'delete') {
      showDeleteDialog(true)
    } else if (action === 'edit') {
      showUserModal(true)
    }
  }

  const onNewUser = () => {
    setUser(defaultUser)
    showUserModal(true)
  }

  const onUserSave = (dataFromModal) => {
    if (user._id) {
      dispatch(UsersActions.updateUserAction(dataFromModal))
    } else {
      dispatch(UsersActions.createUserAction(dataFromModal))
    }
    showUserModal(false)
  }

  const onUserDelete = () => {
    dispatch(UsersActions.deleteUserAction(user))
    showDeleteDialog(false)
  }

  //  ---------------------------------

  return (
    <React.Fragment>
      <div className="flex flex-row justify-end items-center border-b border-neutral-500/50 py-4 text-lg">
        <button type="button" className="btn btn-accent pl-2" onClick={onNewUser}>
          <PlusIcon className="icon h-10 w-10 p-1 inline-block" /> <div className="inline-block">Add new user</div>
        </button>
        <button className="btn btn-inverted ml-4 p-2" onClick={() => dispatch(UsersActions.fetchUsersAction())}>
          <RefreshIcon className={`icon h-10 w-10 p-1 ${(usersLoading && 'animate-spin') || ''}`}/>
        </button>
      </div>

      <section className="body-font text-lg">
        <div className="w-full mx-auto flex items-center justify-center flex-col">
          <div className="text-center w-full ">
            <div className="flex justify-center mt-4">
              <UsersTable
                className="w-full"
                users={users}
                onAction={onAction}
                adminMode={true}
              />
            </div>
          </div>
        </div>
      </section>

      <UserModal
        visible={userModalVisible}
        onClose={() => showUserModal(false)}
        onSave={onUserSave}
        user={user}
        adminMode={true}
      />

      <Modal visible={deleteDialogVisible} onClose={() => showDeleteDialog(false)} header="Are you sure?" className="mini"
        buttons={[
          { caption: 'Yes, I am sure', className: 'btn-accent', onClick: onUserDelete },
          { caption: 'Cancel', className: 'btn-inverted', onClick: () => showDeleteDialog(false) },
        ]}>
        <p>You are going to delete user <span className="font-bold">"{user.firstName} {user.lastName}"</span> !</p>
      </Modal>

    </React.Fragment>
  )
}
