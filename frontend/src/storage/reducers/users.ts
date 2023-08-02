import {
  USERS_BRANCH as BRANCH,
  USERS_FETCH,
  USERS_LOADED,
  USERS_CREATE,
  USERS_CREATED,
  USERS_UPDATE,
  USERS_UPDATED,
  USERS_DELETE,
  USERS_DELETED,
  USERS_ERROR,
} from '@p0/common/constants'

import type { AnyAction } from 'redux'
import type { User } from '@p0/dal'
import type { IAPIError } from '@common/types'

//  ----------------------------------------------------------------------------------------------//
//  types and consts

export type UsersData = {
  users: User.Self[]
  processing?: string|false,
  error?: IAPIError
}

const initialUsersData: UsersData = {
  users: [],
  processing: false,
}

//  ----------------------------------------------------------------------------------------------//
//  redicer

export const reducer = (state = initialUsersData, action: AnyAction): UsersData => {
  switch (action.type) {

    case USERS_FETCH:
    case USERS_CREATE:
    case USERS_DELETE:
    case USERS_UPDATE: {
      return {
        ...state,
        processing: action.type,
        error: undefined
      }
    }

    case USERS_LOADED: {
      return {
        ...state,
        processing: false,
        users: action.payload as User.Self[]
      }
    }

    case USERS_CREATED: {
      return {
        ...state,
        processing: false,
        users: [ ...state.users, action.payload as User.Self]
      }
    }

    case USERS_UPDATED: {
      const users = [...state.users]
      const idx = users.findIndex(c => c._id === action.payload._id)
      if (idx !== -1) {
        users[idx] = action.payload as User.Self
      }
      return {
        ...state,
        processing: false,
        users
      }
    }

    case USERS_DELETED: {
      const users = [...state.users]
      const idx = users.findIndex(c => c._id === action.payload._id as string)
      if (idx !== -1) {
        users.splice(idx, 1)
      }
      return {
        ...state,
        processing: false,
        users
      }
    }

    case USERS_ERROR: {
      return {
        ...state,
        processing: false,
        error: action.payload as IAPIError
      }
    }

    default:
      return state
  }
}

