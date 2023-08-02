import {
  THEME_BRANCH as BRANCH,
  THEME_CHANGE,
  ACCENT_CHANGE,
} from '@p0/common/constants'

import type { AnyAction } from 'redux'

//  ----------------------------------------------------------------------------------------------//

const LS_ITEM = BRANCH + '_DATA'

export type ThemeData = {
  theme: 'dark' | 'light',
  accent: string
}

const defaultState: ThemeData = {
  theme: 'dark',
  accent: 'green'
}

const loadState = (): ThemeData => {
  const data = localStorage.getItem(LS_ITEM)
  const state: ThemeData = (data && JSON.parse(data)) || defaultState
  document.documentElement.setAttribute('data-theme', state.theme)
  document.documentElement.setAttribute('data-accent', state.accent)
  return state
}

//  ---------------------------------
//  redicer

export const reducer = (state = loadState(), action: AnyAction): ThemeData => {
  switch (action.type) {
    case THEME_CHANGE: {
      const newState = {
        ...state,
        theme: action.payload.theme
      }
      localStorage.setItem(LS_ITEM, JSON.stringify(newState))
      document.documentElement.setAttribute('data-theme', newState.theme)
      return newState
    }

    case ACCENT_CHANGE: {
      const newState = {
        ...state,
        accent: action.payload.accent
      }
      localStorage.setItem(LS_ITEM, JSON.stringify(newState))
      document.documentElement.setAttribute('data-accent', newState.accent)
      return newState
    }

    default:
      return state
  }
}

