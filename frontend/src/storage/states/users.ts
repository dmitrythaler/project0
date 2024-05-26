import {
  USERS_BRANCH as BRANCH,
  USERS_FETCH,
  USERS_CREATE,
  USERS_UPDATE,
  USERS_DELETE,
} from '@p0/common/constants'
import { errorPayload, apiInstance } from '@common'
import { sendMessage, sendErrorMessage } from './messages'
import {
  processingStartedAction,
  processingErrorAction,
  usersLoadedAction,
  userCreatedAction,
  userUpdatedAction,
  userDeletedAction
} from '../reducers/users'

import type { User } from '@p0/dal'
import type { ErrorPayload } from '@common'
import type { AppState, AppDispatch } from '../store'

export * from '../reducers/users'

//  ---------------------------------
// utils
const handleError = (err: unknown, dispatch) => {
  const error = errorPayload(<ErrorPayload>err)
  dispatch(sendErrorMessage(error))
  dispatch(processingErrorAction(error))
}


//  selectors
export const getUsers = (state: AppState) => state[BRANCH].users
export const isProcessing = (state: AppState) => state[BRANCH].processing
export const getError = (state: AppState) => state[BRANCH].error && errorPayload(state[BRANCH].error)

// thunks

const ROUTE = '/user'

export const fetchUsers = () =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(processingStartedAction(USERS_FETCH))
    try {
      const resp = await apiInstance.get(`${ROUTE}/list`)
      dispatch(usersLoadedAction(resp.data.users))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const createUserAction = (user: User) =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(processingStartedAction(USERS_CREATE))
    try {
      const { email, fullName, password, isActive, role } = user
      const resp = await apiInstance.post(ROUTE, {
        data: {
          email, fullName, password, isActive, role
        }
      })
      dispatch(userCreatedAction(resp.data.user))
      dispatch(sendMessage(`The user(${fullName}) created.`))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const updateUserAction = (user: User) =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(processingStartedAction(USERS_UPDATE))
    try {
      const { _id, email, fullName, lastLogin, updatedAt, createdAt, ...rest } = user
      const resp = await apiInstance.patch(`${ROUTE}/${_id}`, {
        data: {
          email, fullName, ...rest
        }
      })
      dispatch(userUpdatedAction(resp.data.user))
      dispatch(sendMessage(`The user(${fullName}) updated.`))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const deleteUserAction = (user: User) =>
  async (dispatch: AppDispatch): Promise<void> => {
    dispatch(processingStartedAction(USERS_DELETE))
    try {
      await apiInstance.delete(`${ROUTE}/${user._id}`)
      dispatch(userDeletedAction(user._id!))
      dispatch(sendMessage(`The user(${user.fullName}) deleted.`))
    } catch (err) {
      handleError(err, dispatch)
    }
  }
