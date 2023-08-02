import { hrSize } from '@common'
import './style.css'

// @ts-ignore
import EditIcon from '../../assets/feather.inline.icons/edit.svg'
// @ts-ignore
import TrashIcon from '../../assets/feather.inline.icons/trash-2.svg'

//  ---------------------------------

export default function ({ media, onAction, className = '' }) {
  return (
    <div className={'w-full rounded-md border subtle-border subtle-shadow overflow-hidden ' + className}>
      <table className="w-full bg-gray-400 bg-opacity-25 py-1 px-3 text-lg">
        <thead className="border-b subtle-border text-accent-contrast">
          <tr className="bg-gray-400/50">
            <th className="w-4/12 p-3 text-left">Id/Slug</th>
            <th className="w-4/12 p-3 text-left">Original File</th>
            <th className="w-1/12 p-3 text-right">Size</th>
            <th className="w-1/12 p-3 text-right">Width</th>
            <th className="w-1/12 p-3 text-right">Height</th>
            <th className="w-1/12 p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="">
          {(media || []).map(m => {
            return (<tr className="border-t subtle-border" key={m._id}>
              <td className="py-1 px-3 font-bold">{m._id}{m.slug ? '/' + m.slug : ''}</td>
              <td className="py-1 px-3">{m.fileName}</td>
              <td className="py-1 px-3 text-right">{hrSize(m.fileSize)}</td>
              <td className="py-1 px-3 text-right">{m.width}</td>
              <td className="py-1 px-3 text-right">{m.height}</td>
              <td className="py-1 px-3 text-right">
                <button className="action" onClick={e => onAction(e, 'update', m)}><EditIcon className="icon w-8 h-8" /></button>
                <button className="action" onClick={e => onAction(e, 'delete', m)}><TrashIcon className="icon w-8 h-8" /></button>
              </td>
            </tr>)
          })}

        </tbody>
      </table>
    </div>
  )
}
