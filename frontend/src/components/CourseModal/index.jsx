import React, { useState, useEffect } from 'react'
import Modal from '@components/Modal'

import './style.css'

//  ---------------------------------

export default ({ visible, onClose, onSave, course, adminMode }) => {

  const [currCourse, setCurrCourse] = useState({
    name: '',
    squidexId: '',
    squidexSecret: '',
    version: 1,
    prefix: '',
    s3Folder: '',
    squidexAuthState: 'GREEN',
    sincePublished: '',
    publishedAt: ''
  })

  const [validationError, setValidationError] = useState({})
  useEffect(() => {
    course.prefix = course.prefix || ''
    course.s3Folder = course.s3Folder || ''
    setCurrCourse(course)
  }, [course])

  const update = course && course.uuid

  const onChange = e => {
    setCurrCourse({
      ...currCourse,
      [e.target.name]: e.target.value
    })
  }

  const validateBeforeSave = () => {
    let error = false
    const ve = {
      name: !currCourse.name,
      squidexId: !currCourse.squidexId,
      squidexSecret: !currCourse.squidexSecret,
    }
    if (!currCourse.name) {
      ve.name = true
      error = true
    }
    if (!currCourse.squidexId) {
      ve.squidexId = true
      error = true
    }
    if (!currCourse.squidexSecret) {
      ve.squidexSecret = true
      error = true
    }

    if (!error) {
      onSave(currCourse)
    } else {
      setValidationError(ve)
      setTimeout(() => {
        setValidationError({})
      }, 700)

    }
  }

  const hasError = (prop) => (validationError[prop] && 'error') || ''

  const SincePublished = ({ val }) => (
    <span>
      {Object.entries(val || { total: 0 }).map(([k, v]) =>
        (<span key={'spkey-' + k} className={v ? 'font-bold' : ''}>{k}: {v} </span> )
      ) }
    </span>
  )

  const classForState = (state, classes) =>
    classes + (state === 'GREEN'
      ? ' bg-green-900 text-green-200'
      : state === 'YELLOW'
        ? ' bg-yellow-900 text-yellow-200'
        : ' bg-red-900 text-red-100'
    )

  const publishedAt = (currCourse.publishedAt && currCourse.publishedAt.replace('T', ' ').slice(0, -5)) || 'never'

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} header={(update ? 'Update' : 'Create') + ' Course'}
      buttons={[
        { caption: (update ? 'Update' : 'Create'), className: 'btn-accent', onClick: () => validateBeforeSave() },
        { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
      ]}>

      <form>
        <div className="grid gap-4 lg:grid-cols-4">

          <div className="mb-4 lg:col-span-3">
            <label htmlFor="name" className="">Course Name</label>
            <input type="text" id="name" name="name" onChange={onChange} value={currCourse.name}
              className={`app-input ${hasError('name')}`} placeholder="* Required! Name of the course in Squidex"
            />
          </div>

          <div className="mb-4 lg:col-span-1">
            <label htmlFor="version" className="">Version</label>
            <input type="number" min="1" id="version" name="version" onChange={onChange} value={currCourse.version}
              className="app-input"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4 mb-4">
          <div className="lg:col-span-3">
            <label htmlFor="squidexId" className="">Squidex ID</label>
            {adminMode ? (
              <input type="text" id="squidexId" name="squidexId" onChange={onChange} value={currCourse.squidexId}
                className={`app-input ${hasError('squidexId')}`} placeholder="* Required! Credential in Squidex"
              />
            ) : (
                <input type="text" id="squidexId" name="squidexId" value={currCourse.squidexId}
                  className="app-input disabled" disabled
                />
            )}
          </div>

          <div className="lg:col-span-1">
            <label htmlFor="prefix" className="">Prefix</label>
            <input type="text" id="prefix" name="prefix" onChange={onChange} value={currCourse.prefix}
              className="app-input"
            />
          </div>

        </div>

        <div className="mb-4">
          <label htmlFor="squidexSecret" className="">Squidex Secret</label>
          {adminMode ? (
            <input type="text" id="squidexSecret" name="squidexSecret" onChange={onChange} value={currCourse.squidexSecret}
              className={`app-input ${hasError('squidexSecret')}`} placeholder="* Required! Credential in Squidex"
            />
          ) : (
              <input type="text" id="squidexSecret" name="squidexSecret" value={currCourse.squidexSecret}
                className="app-input disabled" disabled
              />
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="s3Folder" className="">S3 Folder</label>
          <input type="text" id="s3Folder" name="s3Folder" onChange={onChange} value={currCourse.s3Folder}
            className="app-input" placeholder="default is name"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-4 mb-4">
          <div className="lg:col-span-3">
            <label htmlFor="publishedAt" className="">Published</label>
            <input type="text" id="publishedAt" name="publishedAt" value={publishedAt}
              className="app-input disabled" disabled
            />
          </div>
          <div className="lg:col-span-1">
            <label className="">Auth State</label>
            <div className={classForState(currCourse.squidexAuthState, 'app-input')}>
              {currCourse.squidexAuthState}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label>Data updated since last since the last publication</label>
          <div className="app-input disabled">
            <SincePublished val={currCourse.sincePublished} />
          </div>
        </div>

      </form>

    </Modal>
  )
}
