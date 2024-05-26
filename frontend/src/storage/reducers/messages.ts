import { createReducer, createAction } from '@reduxjs/toolkit'
import type * as RT from '@reduxjs/toolkit'

import {
  MSGS_BRANCH as BRANCH,
  MSGS_SEND,
  MSGS_DELETE,
} from '@p0/common/constants'


//  ---------------------------------

export type Message = {
  body: string
  header?: string
  timeout?: number
  id?: number
}

// utils
export const prepMessage = (m: Message | string): Message => ({
  header: 'Information',
  timeout: 5,
  id: Math.floor(Math.random() * 1000000),
  ...(typeof m === 'string' ? { body: m } : m)
})

// actions
export const sendMessageAction = createAction(MSGS_SEND, function prepare(m: Message|string) {
  return {
    payload: prepMessage(m)
  }
})

export const deleteMessageAction = createAction<number>(MSGS_DELETE)

// reducer

const messageReducer: RT.Reducer = createReducer(
  [] as Message[],
  (builder) => {
    builder.addCase(sendMessageAction, (state, action) => {
      state.push(action.payload)
    })
    builder.addCase(deleteMessageAction, (state, action) => {
      const idx = state.findIndex(m => m.id === action.payload)
      if (idx !== -1) {
        state.splice(idx, 1)
      }
    })
  }
)

export default messageReducer
