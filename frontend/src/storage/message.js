export const BRANCH = 'MSGS'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

// message
//   msg = {
//     body: msg,
//     header: 'Info' //  'Warning', 'Deep Shit' ...
//     timeout: 5,  //  seconds, default value, falsy means never
//     id: Math.floor( Math.random() * 1000000 )  //
//   }

export const MSGS_SEND = 'MSGS/SEND'
export const MSGS_DELETE = 'MSGS/DELETE'

//  ---------------------------------
//  selectors

export function getMessages(state) {
  return state[BRANCH]
}

//  ----------------------------------------------------------------------------------------------//
//  async action creators

export function sendMsg(msg) {
  return dispatch => {

    if (typeof msg === 'string') {
      msg = { body: msg }
    }
    msg = {
      header: 'Information',
      timeout: 5,
      id: Math.floor( Math.random() * 1000000 ),
      ...msg
    }

    dispatch({ type: MSGS_SEND, payload: msg })

    if (msg.timeout) {
      setTimeout(() => {
        dispatch({ type: MSGS_DELETE, payload: msg.id })
      }, msg.timeout * 1000)
    }
  }
}

export function delMsg(msgId) {
  return dispatch => dispatch({ type: MSGS_DELETE, payload: msgId })
}


//  ----------------------------------------------------------------------------------------------//
//  redicer

export default function reducer(state = [], action) {
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

