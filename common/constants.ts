//  ----------------------------------------------------------------------------------------------//
//  cpmmon

export const BCRYPT_ROUNDS_NUM = 12
export const HEARTBEAT_STR = 'HEARTBEAT'
export const HEARTBEAT_INTERVAL = 10_000
export const TOKEN_COOKIE_NAME = 'token'
export const EXPIRY_COOKIE_NAME = 'expiry'
export const WSS_AUTH_TIMEOUT = 10_000

//  ----------------------------------------------------------------------------------------------//
//  redux store events
//  Themes
export const THEME_BRANCH = 'THEME'
export const THEME_CHANGE = `${THEME_BRANCH}/CHANGE`
export const ACCENT_CHANGE = `${THEME_BRANCH}/ACCENT_CHANGE`

//  Messages
export const MSGS_BRANCH = 'MSGS'
export const MSGS_SEND = `${MSGS_BRANCH}/SEND`
export const MSGS_DELETE = `${MSGS_BRANCH}/DELETE`

//  WebSoket
export const WS_BRANCH = 'WS'
export const WS_LOGIN = `${WS_BRANCH}/LOGIN`
export const WS_LOGOUT = `${WS_BRANCH}/LOGOUT`
export const WS_CONNECTED = `${WS_BRANCH}/CONNECTED`
export const WS_RECEIVED = `${WS_BRANCH}/RECEIVED`
export const WS_CLOSED = `${WS_BRANCH}/CLOSED`

// App Events
export const EVENTS_BRANCH = 'EVENTS'
export const EVENTS_ADD = `${EVENTS_BRANCH}/ADD`
export const EVENTS_CLEAR = `${EVENTS_BRANCH}/CLEAR`

// App Status
export const STATUS_BRANCH = 'STATUS'
export const STATUS_FETCH = `${STATUS_BRANCH}/FETCH`
export const STATUS_LOADED = `${STATUS_BRANCH}/LOADED`
export const STATUS_ERROR = `${STATUS_BRANCH}/ERROR`

// Session
export const SESSION_BRANCH = 'SESSION'
export const SESSION_LOGIN = `${SESSION_BRANCH}/LOGIN`
export const SESSION_LOGOUT = `${SESSION_BRANCH}/LOGOUT`
export const SESSION_LOADED = `${SESSION_BRANCH}/LOADED`
export const SESSION_STARTED = `${SESSION_BRANCH}/STARTED`
export const SESSION_EXPIRED = `${SESSION_BRANCH}/EXPIRED`
export const SESSION_ENDED = `${SESSION_BRANCH}/ENDED`
export const SESSION_UPDATED = `${SESSION_BRANCH}/UPDATED`
export const SESSION_ERROR = `${SESSION_BRANCH}/ERROR`

// User
export const USERS_BRANCH = 'USERS'
export const USERS_FETCH = `${USERS_BRANCH}/FETCH`
export const USERS_LOADED = `${USERS_BRANCH}/LOADED`
export const USERS_CREATE = `${USERS_BRANCH}/CREATE`
export const USERS_CREATED = `${USERS_BRANCH}/CREATED`
export const USERS_UPDATE = `${USERS_BRANCH}/UPDATE`
export const USERS_UPDATED = `${USERS_BRANCH}/UPDATED`
export const USERS_DELETE = `${USERS_BRANCH}/DELETE`
export const USERS_DELETED = `${USERS_BRANCH}/DELETED`
export const USERS_ERROR = `${USERS_BRANCH}/ERROR`

// Media
export const MEDIA_BRANCH = 'MEDIA'
export const MEDIA_FETCH = `${MEDIA_BRANCH}/FETCH`
export const MEDIA_LOADED = `${MEDIA_BRANCH}/LOADED`
export const MEDIA_UPLOAD = `${MEDIA_BRANCH}/UPLOAD`
export const MEDIA_UPLOADED = `${MEDIA_BRANCH}/UPLOADED`
export const MEDIA_UPDATE = `${MEDIA_BRANCH}/UPDATE`
export const MEDIA_UPDATED = `${MEDIA_BRANCH}/UPDATED`
export const MEDIA_DELETE = `${MEDIA_BRANCH}/DELETE`
export const MEDIA_DELETED = `${MEDIA_BRANCH}/DELETED`
export const MEDIA_ERROR = `${MEDIA_BRANCH}/ERROR`
