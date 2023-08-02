import {
  MSGS_BRANCH as BRANCH,
  MSGS_SEND,
  MSGS_DELETE,
} from '@p0/common/constants'

import type { IAPIError } from '@common/types'
import type { Message } from '../reducers/messages'
import type { RootState, AppThunk } from '../store'


//  ----------------------------------------------------------------------------------------------//
//  selectors

export const getMessages = (state: RootState): Message[] => state[BRANCH]

//  ----------------------------------------------------------------------------------------------//
//  action creators

export const sendMessageAction = (msg: Message | string): AppThunk =>
  (dispatch) => {
    const message: Message = {
      header: 'Information',
      timeout: 5,
      id: Math.floor( Math.random() * 1000000 ),
      ...( typeof msg === 'string' ? { body: msg } : msg )
    }
    dispatch({ type: MSGS_SEND, payload: message })

    if (message.timeout) {
      setTimeout(() => {
        dispatch({ type: MSGS_DELETE, payload: message.id })
      }, message.timeout * 1000)
    }
  }

export const sendErrorMessageAction = (err: IAPIError): AppThunk => sendMessageAction({
    header: err.name,
    timeout: 0,
    id: Math.floor(Math.random() * 1000000),
    body: `${err.message} (code: ${err.code || 'N/A'}, id: ${err.id || 'N/A'})`
  })

export const delMsg = (msgId: number): AppThunk =>
  (dispatch) => dispatch({ type: MSGS_DELETE, payload: msgId })

