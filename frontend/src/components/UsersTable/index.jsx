import React from 'react'
import './style.css'


import { ReactComponent as EditIcon } from '@assets/feather.inline.icons/edit.svg'
import { ReactComponent as ActiveIcon } from '@assets/feather.inline.icons/check-square.svg'
import { ReactComponent as InactiveIcon } from '@assets/feather.inline.icons/square.svg'
import { ReactComponent as TrashIcon } from '@assets/feather.inline.icons/trash-2.svg'

//  ---------------------------------

export default function({ users, onAction, adminMode }) {
  return (
    <div className="w-full rounded-md border subtle-border subtle-shadow overflow-hidden">
      <table className="w-full bg-gray-400 bg-opacity-25 py-1 px-3 text-lg">
        <thead className="border-b subtle-border text-accent-contrast">
          <tr className="bg-gray-400/50">
            <th className="w-3/12 py-3 text-left pl-3">Email</th>
            <th className="w-2/12 py-3 text-left pl-3">Name</th>
            <th className="w-2/12 py-3">Role</th>
            <th className="w-2/12 py-3">Last login</th>
            <th className="w-1/12 py-3">Active</th>
            <th className="w-2/12 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="">
          {(users || []).map(user => {
            const lastLogin = (user.lastLogin && user.lastLogin.replace('T', ' ').slice(0, -5)) || 'never'
            const role = user.role === 'admin' ? 'Admin' : 'Publisher'

            return (<tr className="border-t subtle-border" key={user.uuid}>
              <td className="py-2 px-4 font-bold">{user.email}</td>
              <td className="py-2 px-4">{user.firstName} {user.lastName}</td>
              <td className="py-2 px-4 text-center">{role}</td>
              <td className="py-2 px-4 text-center">{lastLogin}</td>
              <td className="py-2 px-4 text-center">{user.isActive
                ? (<ActiveIcon className="icon w-8 h-8 mx-auto" />)
                : (<InactiveIcon className="icon w-8 h-8 mx-auto" />)
              }</td>
              <td className="py-2 px-4 text-center">
                <button className="action" onClick={e => onAction(e, 'edit', user)}><EditIcon className="icon w-8 h-8" /></button>
                {adminMode ? (
                  <button className="action" onClick={e => onAction(e, 'delete', user)}><TrashIcon className="icon w-8 h-8" /></button>
                ) : null}
              </td>
            </tr>)
          })}

        </tbody>
      </table>
    </div>
  )
}
