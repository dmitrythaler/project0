import {
  EXPIRY_COOKIE_NAME,
  TOKEN_COOKIE_NAME,
} from '@p0/common/constants'
import { getExpiration } from './states/session'
import { sessionUpdatedAction } from './reducers/session'
import { apiInstance } from '@common'

import type { AppStore } from './store'

//  ---------------------------------

export const getExpCookie = (): number | null => {
  const cookies = document.cookie
  const found = cookies.split(';').find(c => c.trim().startsWith(EXPIRY_COOKIE_NAME))
  return (found ? parseFloat(found.split('=')[1]) : null)/*possibly NaN*/ || null
}

export const cleanCookies = () => {
  document.cookie = `${EXPIRY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// intercepts successful API requests and update session
export const cookieWatcher = (store: AppStore) => {
  apiInstance.interceptors.response.use(resp => {
    const exp = getExpCookie()
    const storedExp = getExpiration(store.getState())
    if (storedExp !== exp) {
      store.dispatch(sessionUpdatedAction(exp))
    }
    return resp
  })
}
