import { sendMessageAction, deleteMessageAction } from '../reducers/messages'
import { prepMessage } from '../reducers/messages'

import type { Message } from '../reducers/messages'
import type { IAPIError } from '@p0/common/types'
import type { AppState, AppDispatch } from '../store'

import {
  MSGS_BRANCH as BRANCH,
} from '@p0/common/constants'

export * from '../reducers/messages'

//  ---------------------------------

// selectors
export const getMessages = (state: AppState): Message[] => state[BRANCH]

// thunks
export const sendMessage = (m: Message | string) =>
  (dispatch: AppDispatch) => {
    const message: Message = prepMessage(m)
    dispatch(sendMessageAction(message))

    if (message.timeout) {
      setTimeout(() => {
        dispatch(deleteMessageAction(message.id!))
      }, message.timeout * 1000)
    }
  }

export const sendErrorMessage = (err: IAPIError) => sendMessageAction({
  header: err.name,
  timeout: 0,
  id: Math.floor(Math.random() * 1000000),
  body: `${err.message} (code: ${err.code || 'N/A'}, id: ${err.id || 'N/A'})`
})

