import {
  USERS_BRANCH as BRANCH,
  USERS_FETCH,
  USERS_LOADED,
  USERS_CREATE,
  USERS_UPDATE,
  USERS_DELETE,
  USERS_ERROR,
  // USERS_CREATED,
  // USERS_UPDATED,
  // USERS_DELETED,
} from '@p0/common/constants'
import { errorPayload, apiInstance } from '@common'
import { sendMessageAction, sendErrorMessageAction } from './messages'

import type { User } from '@p0/dal'
import type { ErrorPayload } from '@common'
import type { RootState, AppThunk, AppThunkDispatch } from '../store'

//  ---------------------------------------------------------------------------------------------//
//  types and consts

const ROUTE = '/user'

//  ---------------------------------
//  selectors

export const getUsers = (state: RootState) => state[BRANCH].users
export const isProcessing = (state: RootState) => state[BRANCH].processing !== false
export const getError = (state: RootState) =>
  state[BRANCH].processing === USERS_ERROR
    ? errorPayload(state[BRANCH].error!)
    : null

//  ----------------------------------------------------------------------------------------------//
//  action creators

const handleError = (err: unknown, dispatch: AppThunkDispatch) => {
  const error = errorPayload(<ErrorPayload>err)
  dispatch(sendErrorMessageAction(error))
  dispatch({ type: USERS_ERROR, payload: error })
}

//  ---------------------------------

export const fetchUsersAction = (): AppThunk =>
  async (dispatch: AppThunkDispatch): Promise<void> => {
    dispatch({ type: USERS_FETCH })
    try {
      const resp = await apiInstance.get(`${ROUTE}/list`)
      dispatch({
        type: USERS_LOADED,
        payload: resp.data.users
      })
    } catch(err) {
      handleError(err, dispatch)
    }
  }

export const createUserAction = (user: User.Self): AppThunk =>
  async (dispatch: AppThunkDispatch): Promise<void> => {
    dispatch({ type: USERS_CREATE })
    try {
      const { email, lastName, firstName, password, isActive, role } = user
      const resp = await apiInstance.post( ROUTE, {
        data: {
          email, lastName, firstName, password, isActive, role
        }
      })
      // dispatch({
      //   type: USERS_CREATED,
      //   payload: resp.data.user
      // })
      dispatch(sendMessageAction(`The user(${firstName} ${lastName}) created.`))
    } catch(err) {
      handleError(err, dispatch)
    }
  }

export const updateUserAction = (user: User.Self): AppThunk =>
  async (dispatch: AppThunkDispatch): Promise<void> => {
    dispatch({ type: USERS_UPDATE })
    try {
      const { _id, email, lastName, firstName, lastLogin, updatedAt, createdAt, ...rest } = user
      const resp = await apiInstance.patch(`${ROUTE}/${_id}`, {
        data: {
          email, lastName, firstName, ...rest
        }
      })
      // dispatch({
      //   type: USERS_UPDATED,
      //   payload: resp.data.user
      // })
      dispatch(sendMessageAction(`The user(${firstName} ${lastName}) updated.`))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const deleteUserAction = (user: User.Self): AppThunk =>
  async (dispatch: AppThunkDispatch): Promise<void> => {
    dispatch({ type: USERS_DELETE })
    try {
      await apiInstance.delete(`${ROUTE}/${user._id}`)
      // dispatch({
      //   type: USERS_DELETED,
      //   payload: { _id: user._id }
      // })
      dispatch(sendMessageAction(`The user(${user.firstName} ${user.lastName}) deleted.`))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

