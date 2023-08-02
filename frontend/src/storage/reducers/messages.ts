import {
  MSGS_BRANCH as BRANCH,
  MSGS_SEND,
  MSGS_DELETE,
} from '@p0/common/constants'
import type { AnyAction } from 'redux'

//  ----------------------------------------------------------------------------------------------//
// types

export type Message = {
  body: string
  header?: string
  timeout?: number
  id?: number
}

//  ----------------------------------------------------------------------------------------------//
//  redicer

export const reducer = (state: Message[] = [], action: AnyAction): Message[] => {
  switch (action.type) {
    case MSGS_SEND: {
      state = [...state]
      state.push(action.payload)
      return state
    }

    case MSGS_DELETE: {
      state = [...state]
      const idx = state.findIndex(m => m.id === action.payload)
      if (idx !== -1) {
        state.splice(idx, 1)
      }
      return state
    }

    default:
      return state
  }
}

