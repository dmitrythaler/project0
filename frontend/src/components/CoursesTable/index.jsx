import React from 'react'

import './style.css'

import { ReactComponent as EditIcon } from '@assets/feather.inline.icons/edit.svg'
import { ReactComponent as CheckIcon } from '@assets/feather.inline.icons/check-square.svg'
import { ReactComponent as TrashIcon } from '@assets/feather.inline.icons/trash-2.svg'
import { ReactComponent as PublishIcon } from '@assets/feather.inline.icons/external-link.svg'
import { ReactComponent as RunningIcon } from '@assets/feather.inline.icons/loader.svg'
import { ReactComponent as BulkerIcon } from '@assets/feather.inline.icons/file-text.svg'

//  ---------------------------------

const checkClass = (state, classes) =>
  classes + (state === 'GREEN'
    ? ' text-green-600'
    : state === 'YELLOW'
      ? ' text-yellow-600'
      : ' text-red-600'
  )

export default function({ courses, events, onAction, adminMode }) {
  return (
    <div className="w-full rounded-md border subtle-border subtle-shadow overflow-hidden">
      <table className="w-full bg-gray-400 bg-opacity-25 py-1 px-3 text-lg">
        <thead className="border-b subtle-border text-accent-contrast">
          <tr className="bg-gray-400/50">
            <th className="w-4/12 py-3 text-left pl-3">Course Name</th>
            <th className="w-1/12 py-3">Version</th>
            <th className="w-3/12 py-3">Published At</th>
            <th className="w-3/12 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="">
          {(courses || []).map(course => {
            const running = events[course.name]
            const publishedAt = (course.publishedAt && course.publishedAt.replace('T', ' ').slice(0, -5)) || 'never'

            return (<tr className="border-t subtle-border" key={course.uuid}>
              <td className="py-2 px-4 font-bold">{course.name}</td>
              <td className="py-2 px-4 text-center">{course.version}</td>
              <td className="py-2 px-4 text-center">{publishedAt}</td>
              <td className="py-2 px-4 flex justify-center content-center">
                <button className="action" onClick={e => onAction(e, 'edit', course)}><EditIcon className="icon w-8 h-8" /></button>
                <button className="action" onClick={e => onAction(e, 'bulkUpdate', course)}><BulkerIcon className="icon w-8 h-8" /></button>
                <button
                  className={checkClass(course.squidexAuthState)}
                  onClick={e => onAction(e, 'check', course)}
                >
                    <CheckIcon className="icon w-8 h-8" />
                </button>
                {running
                  ? (<div className="action"><RunningIcon className="text-red-500 icon animate-spin w-8 h-8" /></div>)
                  : (<button className="action" onClick={e => onAction(e, 'publish', course)}><PublishIcon className="icon w-8 h-8" /></button>)
                }
                {adminMode ? (
                  <button className="action" onClick={e => onAction(e, 'delete', course)}><TrashIcon className="icon w-8 h-8" /></button>
                ) : null}
              </td>
            </tr>)
          })}

        </tbody>
      </table>
    </div>
  )
}
