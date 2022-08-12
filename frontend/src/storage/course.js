import { apiInstance } from '../config'
import { sendMsg } from './message'

export const BRANCH = 'COURSES'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const COURSES_FETCH = 'COURSES/FETCH'
export const COURSES_LOADED = 'COURSES/LOADED'
export const COURSES_ERROR = 'COURSES/ERROR'
export const COURSE_CREATE = 'COURSE/CREATE'
export const COURSE_CREATED = 'COURSE/CREATED'
export const COURSE_UPDATE = 'COURSE/UPDATE'
export const COURSE_UPDATED = 'COURSE/UPDATED'
export const COURSE_DELETE = 'COURSE/DELETE'
export const COURSE_DELETED = 'COURSE/DELETED'
export const COURSE_PUB_START = 'COURSE/PUB/START'
export const COURSE_PUB_STARTED = 'COURSE/PUB/STARTED'
export const COURSE_CHECK = 'COURSE/CHECK'
export const COURSE_CHECKED = 'COURSE/CHECKED'
export const COURSE_ERROR = 'COURSE/ERROR'

//  ---------------------------------
//  selectors

export function getCourses(state) {
  return state[BRANCH].courses
}

export function getRequestStatus(state) {
  return state[BRANCH].status
}

export function getCoursesLoading(state) {
  return state[BRANCH].status === COURSES_FETCH
}

export function getLastRequestError(state) {
  if(state[BRANCH].status !== COURSE_ERROR && state[BRANCH].status !== COURSES_ERROR) {
    return null
  }
  const err = state[BRANCH].error
  return err.response?.data || err.response || err
}

//  ----------------------------------------------------------------------------------------------//
//  async action creators

const sendErrorMsg = err => {
  const data = err.response.data || err.response || err
  return sendMsg({
    header: 'Course Operation error',
    body: `${data.message} (Code: ${data.code}, id: ${data.id})`,
    timeout: 0
  })
}

//  ---------------------------------

export function fetchCourses() {
  return async dispatch => {
    dispatch({
      type: COURSES_FETCH
    })

    try {
      const resp = await apiInstance.get('/course/list')
      dispatch({
        type: COURSES_LOADED,
        payload: resp.data.courses
      })
    } catch(err) {
      dispatch({ type: COURSES_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function createCourse(course) {
  return async dispatch => {
    dispatch({
      type: COURSE_CREATE
    })

    try {
      const { name, version, squidexId, squidexSecret, s3Folder } = course
      const resp = await apiInstance.post('/course', {
        data: {
          name, version, squidexId, squidexSecret, s3Folder
        }
      })
      dispatch({
        type: COURSE_CREATED,
        payload: resp.data.course
      })
      dispatch(sendMsg(`The course(${name}) created.`))
    } catch(err) {
      dispatch({ type: COURSE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function updateCourse(course) {
  return async dispatch => {
    dispatch({
      type: COURSE_UPDATE
    })

    try {
      const { name, version, squidexId, squidexSecret, s3Folder, prefix } = course
      const resp = await apiInstance.patch(`/course/${course.uuid}`, {
        data: {
          name, version, squidexId, squidexSecret, s3Folder, prefix
        }
      })
      dispatch({
        type: COURSE_UPDATED,
        payload: resp.data.course
      })
      dispatch(sendMsg(`The course(${name}) updated.`))

    } catch(err) {
      dispatch({ type: COURSE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function deleteCourse(course) {
  return async dispatch => {
    dispatch({
      type: COURSE_DELETE
    })

    try {
      await apiInstance.delete(`/course/${course.uuid}`)
      dispatch({
        type: COURSE_DELETED,
        payload: course.uuid
      })
      dispatch(sendMsg(`The course(${course.name}) deleted.`))
    } catch(err) {
      dispatch({ type: COURSE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function publishCourse(course) {
  return async dispatch => {
    dispatch({
      type: COURSE_PUB_START
    })

    try {
      await apiInstance.post(`/publisher/${course.name}`)
      dispatch({
        type: COURSE_PUB_STARTED
      })
    } catch(err) {
      dispatch({ type: COURSE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function checkCourse(course) {
  return async dispatch => {
    dispatch({
      type: COURSE_CHECK
    })

    dispatch(sendMsg(`The course(${course.name}) check started`))
    try {
      let resp = await apiInstance.patch(`/course/check-access-level/${course.name}`)
      if (resp.data.course.squidexAuthState === 'GREEN') {
        resp = await apiInstance.patch(`/publisher/unpublished/${course.name}`)
      }
      dispatch({
        type: COURSE_CHECKED,
        payload: resp.data.course
      })

      const c = resp.data.course
      const e = c?.sincePublished?.total || 0
      dispatch(sendMsg({
        header: 'Done',
        timeout: 0,
        body: c.squidexAuthState === 'GREEN'
          ? `The course(${c.name}) successfully checked: it has "${c.squidexAuthState}" auth state and ${e} entities updated since last publishing.`
          : `The course(${c.name}) successfully checked: it has "${c.squidexAuthState}" auth state.`
      }))
    } catch(err) {
      dispatch({ type: COURSE_ERROR, payload: err })
      dispatch(sendErrorMsg(err))
    }
  }
}


//  ----------------------------------------------------------------------------------------------//
//  redicer
const initialState = {
  status: '',
  error: null,
  courses: []
}

export default function reducer(state = initialState, action) {
  switch (action.type) {

    case COURSES_FETCH:
    case COURSE_CREATE:
    case COURSE_UPDATE:
    case COURSE_DELETE:
    case COURSE_CHECK:
    case COURSE_PUB_START:
    case COURSE_PUB_STARTED: {
      return {
        ...state,
        status: action.type
      }
    }

    case COURSES_LOADED: {
      return {
        status: COURSES_LOADED,
        courses: action.payload
      }
    }

    case COURSES_ERROR: {
      return {
        status: COURSES_ERROR,
        error: action.payload,
        courses: []
      }
    }

    case COURSE_CREATED: {
      return {
        status: COURSE_CREATED,
        courses: [ ...state.courses, action.payload]
      }
    }

    case COURSE_UPDATED:
    case COURSE_CHECKED: {
      const courses = [...state.courses]
      const idx = courses.findIndex(c => c.uuid === action.payload.uuid)
      if (idx !== -1) {
        courses[idx] = action.payload
      } else {
        console.error(action.type + ', something stupid: course not found', action.payload)
      }
      return {
        status: action.type,
        courses
      }
    }

    case COURSE_DELETED: {
      const courses = [...state.courses]
      const idx = courses.findIndex(c => c.uuid === action.payload)
      if (idx !== -1) {
        courses.splice(idx, 1)
      } else {
        console.error('COURSE_DELETED, something stupid: course not found', action.payload)
      }
      return {
        status: COURSE_DELETED,
        courses
      }
    }

    case COURSE_ERROR: {
      return {
        status: COURSE_ERROR,
        error: action.payload,
        courses: [...state.courses]
      }
    }

    default:
      return state
  }
}

