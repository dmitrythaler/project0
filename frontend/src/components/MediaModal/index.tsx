import React, { useState, useEffect } from 'react'
import { hrSize } from '@common'
import Modal from '@components/Modal'
import { MessagesActions, useAppDispatch } from '@storage'

import type { Media } from '@p0/dal'

// @ts-ignore
import DeleteIcon from '../../assets/feather.inline.icons/x-circle.svg'

import './style.css'

type FileWithDimentions = {
  file: File,
  width: number
  height: number
}

//  ---------------------------------
const imgLoad = async (file: File): Promise<FileWithDimentions> => {
  return new Promise((res, rej) => {
    let ourl: string|undefined
    try {
      const img = new Image()
      ourl = URL.createObjectURL(file)
      img.addEventListener('load', e => {
        ourl && URL.revokeObjectURL(ourl)
        res({ file, width: img.naturalWidth, height: img.naturalHeight })
      })
      img.src = ourl
    } catch (error) {
      ourl && URL.revokeObjectURL(ourl)
      rej(error)
    }
  })
}

//  ---------------------------------

export default ({ visible, onClose, onSave, media }) => {

  const [currMedia, setCurrMedia] = useState({ slug: '' } as Media.Self)
  const [validationError, setValidationError] = useState({})
  const [fileList, setFileList] = useState([] as FileWithDimentions[])
  const dispatch = useAppDispatch()

  useEffect(() => {
    setCurrMedia(media || {slug: ''})
  }, [media])

  const onChange = e => {
    setCurrMedia({
      ...currMedia,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    })
  }

  const onChangeFiles = e => {
    const files_ = [...e.target.files]
    const files: File[] = files_.filter(f => f.type.startsWith('image/'))
    if (files_.length > files.length) {
      dispatch(MessagesActions.sendMessageAction({
        header: 'Warning',
        body: 'Incorrect media type, non-image files have been skipped',
      }))
    }
    Promise.all(files.map(imgLoad))
      .then((filesWithDimensions) => {
        setFileList(filesWithDimensions)
      })
      .catch(err => {
        console.error(err.toString())
      })
  }

  const validateBeforeSave = () => {
    let error = false
    const ve: { files?: boolean } = {}
    if (fileList.length === 0) {
      ve.files = true
      error = true
    }

    if (!error) {
      onSave({ slug: currMedia.slug, filesWithDimensions: fileList })
      setFileList([])
    } else {
      setValidationError(ve)
      setTimeout(() => {
        setValidationError({})
      }, 700)
    }
  }

  const onDelete = (idx) => {
    if (fileList && fileList[idx]) {
      const newFileList = [...fileList]
      newFileList.splice(idx, 1)
      setFileList(newFileList)
    }
  }

  const hasError = (prop) => (validationError[prop] && 'error') || ''

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} header="Upload Media"
      buttons={[
        { caption: 'Upload', className: 'btn-accent', onClick: () => validateBeforeSave() },
        { caption: 'Cancel', className: 'btn-inverted', onClick: onClose },
      ]}>

      <form>
        <div className="grid gap-4 lg:grid-cols-6 mb-2">
          <div className="lg:col-span-4">
            <label htmlFor="slug" className="">Slug</label>
            <input type="text" id="slug" name="slug" onChange={onChange} value={currMedia.slug!}
              className={`app-input ${hasError('slug')}`} placeholder="Media's slug, optional"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="files" className="">File(s)</label>
            <input type="file" id="files" name="files" onChange={onChangeFiles}
              className={`app-input files ${hasError('files')}`} multiple
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-6 mb-1">
          {fileList ? fileList.map((fileWithDimensions, idx) => (
            <React.Fragment key={idx}>
            <div className="lg:col-span-3 relative">
              {idx ? null : (<label htmlFor="fileName" className="">File Name</label>)}
              <input type="text" id="fileName" name="fileName" value={fileWithDimensions.file.name} className="app-input disabled" disabled />
              <div key={idx} className="absolute right-0 bottom-0 cursor-pointer" onClick={() => onDelete(idx)}>
                  <DeleteIcon className="icon h-10 w-10 p-2 inline-block" />
              </div>
            </div>
            <div className="lg:col-span-1">
              {idx ? null : (<label htmlFor="size" className="">Size</label>)}
              <input type="text" id="size" name="size" value={hrSize(fileWithDimensions.file.size)} className="app-input text-right disabled" disabled />
            </div>
            <div className="lg:col-span-1">
              {idx ? null : (<label htmlFor="width" className="">Width</label>)}
              <input type="text" id="width" name="width" value={fileWithDimensions.width} className="app-input text-right disabled" disabled />
            </div>
            <div className="lg:col-span-1">
              {idx ? null : (<label htmlFor="height" className="">Height</label>)}
              <input type="text" id="height" name="height" value={fileWithDimensions.height} className="app-input text-right disabled" disabled />
            </div>
            </React.Fragment>
          )) : null}
        </div>


      </form>

    </Modal>
  )
}
