import { useState, useEffect } from 'react'
import { hrSize } from '@common'
import Modal from '@components/Modal'
import type { Media } from '@p0/dal'

import './style.css'

//  ---------------------------------

export default ({ visible, onClose, onSave, media }) => {

  const [currMedia, setCurrMedia] = useState({} as Media.Self)
  const [validationError, setValidationError] = useState({})
  const [updateAllSlugs, setUpdateAllSlugs] = useState(false)

  useEffect(() => {
    setCurrMedia(media)
  }, [media])

  const onChange = e => {
    setCurrMedia({
      ...currMedia,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const onChangeUpdateAllSlugs = e => {
    setUpdateAllSlugs(e.target.checked)
  }

  const hasError = (prop) => (validationError[prop] && 'error') || ''

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} header="Update Media"
      buttons={[
        { caption: 'Update', className: 'btn-accent', onClick: () => onSave({ media: currMedia, originalSlug: media.slug, updateAllSlugs }) },
        { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
      ]}>

      <form>
        <div className="grid gap-4 lg:grid-cols-6 mb-2">
          <div className="lg:col-span-5">
            <label htmlFor="slug" className="">Slug</label>
            <input type="text" id="slug" name="slug" onChange={onChange} value={currMedia.slug || ''}
              className={`app-input ${hasError('slug')}`} placeholder="Media's slug, optional"
            />
          </div>

          <div className="lg:col-span-1">
            <div className="w-full text-right">
              <label htmlFor="updateAllSlugs" className="">Update all slugs</label>
            </div>
            <div className="w-full flex justify-end items-center h-10">
              <input id="updateAllSlugs" name="updateAllSlugs" type="checkbox"
                onChange={onChangeUpdateAllSlugs}
                checked={updateAllSlugs}
                disabled={!currMedia.slug}
                className="w-6 h-6 "
              />
            </div>
          </div>

        </div>

        <div className="grid gap-4 lg:grid-cols-6 mb-1">
          <div className="lg:col-span-3">
            <label htmlFor="fileName" className="">File Name</label>
            <input type="text" id="fileName" name="fileName" value={currMedia.fileName} className="app-input disabled" disabled />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="size" className="">Size</label>
            <input type="text" id="size" name="size" value={hrSize(currMedia.fileSize)} className="app-input text-right disabled" disabled />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="width" className="">Width</label>
            <input type="text" id="width" name="width" value={currMedia.width} className="app-input text-right disabled" disabled />
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="height" className="">Height</label>
            <input type="text" id="height" name="height" value={currMedia.height} className="app-input text-right disabled" disabled />
          </div>
        </div>


      </form>

    </Modal>
  )
}
