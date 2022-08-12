import { STATUS_LOADED } from './status'
import { WS_RECEIVED } from './ws'

export const BRANCH = 'EVENTS'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const EVENT_ADD = 'EVENT/ADD'
export const EVENTS_CLEAR = 'EVENTS/CLEAR'

//  ---------------------------------
//  selectors

export function getEvents(state) {
  return state[BRANCH]
}

//  ----------------------------------------------------------------------------------------------//
//  action creators

export function clearEvents() {
  return {
    type: EVENTS_CLEAR
  }
}

//  ----------------------------------------------------------------------------------------------//
//  utils and redicer

export const subscribe2Events = store => {
  store.subscribe(() => {
    const action = store.getState().LAST_ACTION
    if (action.type === STATUS_LOADED) {
      const { desc, version, env, hash, squidex, aws, db } = action.payload
      store.dispatch({
        type: EVENT_ADD,
        payload: {
          time: new Date(),
          source: 'SYSTEM',
          event: action.type,
          title: action.type,
          data: { desc, version, env, hash, squidex, aws, db }
        }
      })
    } else if (action.type === WS_RECEIVED) {
      const { source, event, data } = action.payload
      store.dispatch({
        type: EVENT_ADD,
        payload: {
          time: new Date(),
          source,
          event,
          title: `${action.type}, ${source}: ${event}`,
          data
        }
      })
    }
  })
}

//  ---------------------------------

export default function reducer(state = [], action) {
  switch (action.type) {
    case EVENT_ADD: {
      return [ ...state, action.payload ]
    }

    case EVENTS_CLEAR: {
      return []
    }

    default:
      return state
  }
}

