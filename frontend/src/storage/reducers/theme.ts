import { createReducer, createAction } from '@reduxjs/toolkit'
import type * as RT from '@reduxjs/toolkit'

import {
  THEME_BRANCH as BRANCH,
  THEME_CHANGE,
  ACCENT_CHANGE,
} from '@p0/common/constants'

//  ---------------------------------

const LS_ITEM = `${BRANCH}_DATA`

export type ThemeData = {
  theme: 'dark' | 'light',
  accent: string
}

// actions
export const themeChangeAction = createAction<'dark' | 'light'>(THEME_CHANGE)
export const accentChangeAction = createAction<string>(ACCENT_CHANGE)

// util
const loadState = (): ThemeData => {
  const data = localStorage.getItem(LS_ITEM)
  const state: ThemeData = (data && JSON.parse(data)) || {
    theme: 'dark',
    accent: 'green'
  }
  document.documentElement.setAttribute('data-theme', state.theme)
  document.documentElement.setAttribute('data-accent', state.accent)
  return state
}

// reducer

const themeReducer: RT.Reducer = createReducer<ThemeData>(
  loadState(),
  builder => {
    builder.addCase(themeChangeAction, (state, action) => {
      state.theme = action.payload
      localStorage.setItem(LS_ITEM, JSON.stringify(state))
      document.documentElement.setAttribute('data-theme', state.theme)
    })
    builder.addCase(accentChangeAction, (state, action) => {
      state.accent = action.payload
      localStorage.setItem(LS_ITEM, JSON.stringify(state))
      document.documentElement.setAttribute('data-accent', state.accent)
    })
  }
)

//  ---------------------------------
export default themeReducer
