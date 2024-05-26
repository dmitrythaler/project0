import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  USERS_REQUEST,
  USERS_LOADED,
  USERS_ERROR,
  USERS_CREATED,
  USERS_UPDATED,
  USERS_DELETED,
} from '@p0/common/constants'
import { errorPayload } from '@common'
import { sendErrorMessage } from '../states/messages'

import type * as RT from '@reduxjs/toolkit'
import type { User } from '@p0/dal'
import type { IAPIError } from '@p0/common/types'
import type { ErrorPayload } from '@common'


//  ---------------------------------

// utils

const handleError = (err: unknown, dispatch) => {
  const error = errorPayload(<ErrorPayload>err)
  dispatch(sendErrorMessage(error))
  dispatch(processingErrorAction(error))
}

// actions
export const processingStartedAction = createAction<string>(USERS_REQUEST)
export const processingErrorAction = createAction<IAPIError>(USERS_ERROR)
export const usersLoadedAction = createAction<User[]>(USERS_LOADED)
export const userCreatedAction = createAction<User>(USERS_CREATED)
export const userUpdatedAction = createAction<User>(USERS_UPDATED)
export const userDeletedAction = createAction<string>(USERS_DELETED)

// reducer

export type UsersData = {
  users: User[]
  processing?: false|string,
  error?: IAPIError
}

const usersReducer: RT.Reducer = createReducer(
  {
    users: [],
    processing: false,
  } as UsersData,
  (builder) => {
    builder.addCase(processingStartedAction, (state, action) => {
      state.processing = action.payload
      state.error = undefined
    })
    builder.addCase(processingErrorAction, (state, action) => {
      state.processing = false
      state.error = action.payload
    })
    builder.addCase(usersLoadedAction, (state, action) => {
      state.processing = false
      state.error = undefined
      state.users = action.payload
    })
    builder.addCase(userCreatedAction, (state, action) => {
      state.processing = false
      state.error = undefined
      state.users.push(action.payload)
    })
    builder.addCase(userUpdatedAction, (state, action) => {
      state.processing = false
      state.error = undefined
      const idx = state.users.findIndex(c => c._id === action.payload._id)
      if (idx !== -1) {
        state.users[idx] = action.payload
      }

    })
    builder.addCase(userDeletedAction, (state, action) => {
      state.processing = false
      state.error = undefined
      const idx = state.users.findIndex(c => c._id === action.payload)
      if (idx !== -1) {
        state.users.splice(idx, 1)
      }
    })
  }
)

export default usersReducer
