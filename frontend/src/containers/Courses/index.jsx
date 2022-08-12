import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from 'react-router-dom'

import { ReactComponent as PlusIcon } from '@assets/feather.inline.icons/plus-square.svg'
import { ReactComponent as RefreshIcon } from '@assets/feather.inline.icons/refresh-cw.svg'
import { ReactComponent as CrosshairIcon } from '@assets/feather.inline.icons/crosshair.svg'

import CoursesTable from '@components/CoursesTable'
import CourseModal from '@components/CourseModal'
import BulkerModal from '@components/BulkerModal'
import Modal from '@components/Modal'

import { sendMsg } from '@storage/message'
import { getUser } from '@storage/session'
import { getEvent } from '@storage/ws'
import {
  getCourses,
  getCoursesLoading,
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  checkCourse,
  publishCourse
} from '@storage/course'
import { runScheduledTests } from '@storage/bulker'

import './style.css'

//  ----------------------------------------------------------------------------------------------//
export default () => {

  const [courseModalVisible, showCourseModal] = useState(false)
  const [bulkerModalVisible, showBulkerModal] = useState(false)
  const [deleteDialogVisible, showDeleteDialog] = useState(false)
  const [publishDialogVisible, showPublishDialog] = useState(false)
  const [checkDialogVisible, showCheckDialog] = useState(false)
  const [testsDialogVisible, showTestsDialog] = useState(false)
  const [course, setCourse] = useState({})
  const [events, setEvents] = useState({})

  const dispatch = useDispatch()

  const coursesLoading = useSelector(getCoursesLoading)
  const courses = useSelector(getCourses)
  const event = useSelector(getEvent)

  const currUser = useSelector(getUser)
  const navigate = useNavigate()
  if (!currUser) {
    navigate('/')
  }

  const adminMode = currUser.role === 'admin'

  //  ---------------------------------

  useEffect(() => {
    if (!event) {
      return
    }
    if (event.source === 'PUB' && event.data?.appName) {
      const next = { ...events }
      const appName = event.data.appName
      next[appName] = !(event.event === 'SUCCESS' || event.event === 'ERROR')
      setEvents(next)

      if (event.event === 'START') {
        dispatch(sendMsg({
          header: 'Course Publication started',
          body: `The publication of the course "${appName}" has begun.`
        }))
      } else if (event.event === 'SUCCESS') {
        dispatch(sendMsg({
          header: 'Course Publication completed',
          body: `The publication of the course "${appName}" successfully completed.`
        }))
        dispatch(fetchCourses())
      } else if (event.event === 'ERROR') {
        dispatch(sendMsg({
          header: 'Course Publication failure',
          body: `The publication of the course "${appName}" incompleted.`,
          timeout: 0
        }))
        dispatch(fetchCourses())
      }
    } else if (event.source === 'UPDATE_RULE') {
      if (event.event === 'SCHEDULED_START') {
        dispatch(sendMsg({
          header: 'Scheduled Tests started',
          body: `Here we go ...`
        }))
      } else if (event.event === 'SCHEDULED_STOP') {
        const { applied, failed } = event.data
        dispatch(sendMsg({
          header: 'Scheduled Tests finished',
          body: `The tests completed, ${applied} tests successful, ${failed} failed.`
        }))
      }

    }
  }, [event])

  useEffect(() => {
    const next = { ...events }
    courses.forEach(course => next[course.name] = next[course.name] || false)
    setEvents(next)
  }, [courses])

  useEffect(() => {
    dispatch(fetchCourses())
  }, [])

  //  ---------------------------------

  const onAction = (e, action, dataFromTable) => {
    setCourse(dataFromTable)

    if (action === 'delete') {
      showDeleteDialog(true)
    } else if (action === 'edit') {
      showCourseModal(true)
    } else if (action === 'bulkUpdate') {
      showBulkerModal(true)
    } else if (action === 'check') {
      showCheckDialog(true)
    } else if (action === 'publish') {
      showPublishDialog(true)
    }
  }

  const onNewCourse = () => {
    setCourse({
      name: '',
      prefix: '',
      version: 1,
      s3Folder: '',
      squidexId: '',
      squidexSecret: '',
      squidexAuthState: 'RED'
    })
    showCourseModal(true)
  }

  const onCourseSave = (dataFromModal) => {
    if (course.uuid) {
      dispatch(updateCourse(dataFromModal))
    } else {
      dispatch(createCourse(dataFromModal))
    }
    showCourseModal(false)
  }

  const onCourseDelete = () => {
    dispatch(deleteCourse(course))
    showDeleteDialog(false)
  }

  const onCourseCheck = () => {
    dispatch(checkCourse(course))
    showCheckDialog(false)
  }

  const onCoursePublish = () => {
    dispatch(publishCourse(course))
    showPublishDialog(false)
  }

  const onRunTests = () => {
    dispatch(runScheduledTests())
    showTestsDialog(false)
  }

  //  ---------------------------------

  return (
    <React.Fragment>
      <div className="flex flex-row justify-end items-center border-b border-neutral-500/50 py-4 text-lg">
        {adminMode ? (
          <>
            <button type="button" className="btn btn-accent pl-2" onClick={() => showTestsDialog(true)}>
            <CrosshairIcon className="icon p-1 h-10 w-10 inline-block" /> <div className="inline-block">Run Tests</div>
          </button>
          <button type="button" className="btn btn-accent ml-4 pl-2" onClick={onNewCourse}>
            <PlusIcon className="icon p-1 h-10 w-10 inline-block" /> <div className="inline-block">Add new course</div>
          </button>
          </>
        ) : null }
        <button className="btn btn-inverted ml-4 p-2" onClick={() => dispatch(fetchCourses())}>
          <RefreshIcon className={`icon p-1 h-10 w-10 ${(coursesLoading && 'animate-spin') || ''}`}/>
        </button>
      </div>

      <section className="body-font text-lg">
        <div className="w-full mx-auto flex items-center justify-center flex-col">
          <div className="text-center w-full ">
            <div className="flex justify-center mt-4">
              <CoursesTable
                className="w-full"
                courses={courses}
                events={events}
                onAction={onAction}
                adminMode={adminMode}
              />
            </div>
          </div>
        </div>
      </section>

      <CourseModal
        visible={courseModalVisible}
        onClose={() => showCourseModal(false)}
        onSave={onCourseSave}
        course={course}
        adminMode={adminMode}
      />

      <BulkerModal
        visible={bulkerModalVisible}
        onClose={() => showBulkerModal(false)}
        courseId={course?.uuid}
        courseName={course?.name}
      />

      <Modal visible={adminMode && deleteDialogVisible} onClose={() => showDeleteDialog(false)} header="Are you sure?" className="mini"
        buttons={[
          { caption: 'Yes, I am sure', className: 'btn-accent', onClick: onCourseDelete },
          { caption: 'Cancel', className: 'btn-inverted', onClick: () => showDeleteDialog(false) },
        ]}>
        <p>You are going to delete course <span className="font-bold">"{course.name}"</span> !</p>
      </Modal>

      <Modal visible={checkDialogVisible} onClose={() => showCheckDialog(false)} header="Course Check" className="mini"
        buttons={[
          { caption: 'Yes', className: 'btn-accent', onClick: onCourseCheck },
          { caption: 'Cancel', className: 'btn-inverted', onClick: () => showCheckDialog(false) },
        ]}>
        <p>This operation is intended to check course's (<span className="font-bold">"{course.name}"</span>) credentials access level and what data has been updated since the last publication. Proceed?</p>
      </Modal>

      <Modal visible={publishDialogVisible} onClose={() => showPublishDialog(false)} header="Publish Course?" className="mini"
        buttons={[
          { caption: 'Yes', className: 'btn-accent', onClick: onCoursePublish },
          { caption: 'Cancel', className: 'btn-inverted', onClick: () => showPublishDialog(false) },
        ]}>
        <p>You are going to publish course <span className="font-bold">"{course.name}"</span>. Continue ?</p>
      </Modal>

      <Modal visible={testsDialogVisible} onClose={() => showTestsDialog(false)} header="Run Scheduled tests?" className="mini"
        buttons={[
          { caption: 'Yes', className: 'btn-accent', onClick: onRunTests },
          { caption: 'Cancel', className: 'btn-inverted', onClick: () => showTestsDialog(false) },
        ]}>
        <p>You are going to start scheduled tests manually. Continue ?</p>
      </Modal>

    </React.Fragment>
  )
}

