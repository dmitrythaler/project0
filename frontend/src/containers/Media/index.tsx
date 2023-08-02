import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppSelector, useAppDispatch, SessionActions, MediaActions } from '@storage'
import MediaTable from '@components/MediaTable'
import MediaModal from '@components/MediaModal'
import MediaModalUpdate from '@components/MediaModalUpdate'
import Modal from '@components/Modal'

import type { Media } from '@p0/dal'

// @ts-ignore
import PlusIcon from '../../assets/feather.inline.icons/plus-square.svg'
// @ts-ignore
import RefreshIcon from '../../assets/feather.inline.icons/refresh-cw.svg'

// TODO: move defaults to storage (?)
const defaultMedia = (): Media.Self => ({
  fileName: '',
  fileSize: 0,
  height: 0,
  width: 0,
  ext: '',
  ownerId: '',
  slug: ''
})

 //  ---------------------------------

 export default () => {

  const [mediaModalVisible, showMediaModal] = useState(false)
  const [mediaModalUpdateVisible, showMediaModalUpdate] = useState(false)
  const [deleteDialogVisible, showDeleteDialog] = useState(false)
  const [media, setMedia] = useState(defaultMedia())

  const dispatch = useAppDispatch()

  const mediaLoading = useAppSelector(MediaActions.isLoading)
  const mediaList = useAppSelector(MediaActions.getMedia)

  const currUser = useAppSelector(SessionActions.getUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (!currUser) {
      navigate('/')
    }
  }, [currUser])

  useEffect(() => {
    if (currUser) {
      dispatch(MediaActions.fetchMediaAction())
    }
  }, [])

  //  ---------------------------------

  const onAction = (e, action, dataFromTable) => {
    setMedia(dataFromTable)
    if (action === 'delete') {
      showDeleteDialog(true)
    } else if (action === 'update') {
      showMediaModalUpdate(true)
    }
  }

  const onNewMedia = () => {
    setMedia(defaultMedia)
    showMediaModal(true)
  }

  const onMediaUpload = (dataFromModal) => {
    dispatch(MediaActions.uploadMediaAction(dataFromModal))
    showMediaModal(false)
  }

  const onMediaUpdate = (dataFromModal) => {
    dispatch(MediaActions.updateMediaAction(dataFromModal))
    showMediaModalUpdate(false)
  }

  const onMediaDelete = () => {
    dispatch(MediaActions.deleteMediaAction(media))
    showDeleteDialog(false)
  }

  //  ---------------------------------

  return (
    <React.Fragment>
      <div className="flex flex-row justify-end items-center border-b border-neutral-500/50 py-4 text-lg">
        <button type="button" className="btn btn-accent pl-2" onClick={onNewMedia}>
          <PlusIcon className="icon h-10 w-10 p-1 inline-block" /> <div className="inline-block">Upload new media</div>
        </button>
        <button className="btn btn-inverted ml-4 p-2" onClick={() => dispatch(MediaActions.fetchMediaAction())}>
          <RefreshIcon className={`icon h-10 w-10 p-1 ${(mediaLoading && 'animate-spin') || ''}`}/>
        </button>
      </div>

      <section className="body-font text-lg">
        <div className="w-full mx-auto flex items-center justify-center flex-col">
          <div className="text-center w-full ">
            <div className="flex justify-center mt-4">
              <MediaTable
                className="w-full"
                media={mediaList}
                onAction={onAction}
              />
            </div>
          </div>
        </div>
      </section>

      <MediaModal
        visible={mediaModalVisible}
        onClose={() => showMediaModal(false)}
        onSave={onMediaUpload}
        media={media}
      />

      <MediaModalUpdate
        visible={mediaModalUpdateVisible}
        onClose={() => showMediaModalUpdate(false)}
        onSave={onMediaUpdate}
        media={media}
      />

      <Modal visible={deleteDialogVisible} onClose={() => showDeleteDialog(false)} header="Are you sure?" className="mini"
        buttons={[
          { caption: 'Yes, I am sure', className: 'btn-accent', onClick: onMediaDelete },
          { caption: 'Cancel', className: 'btn-inverted', onClick: () => showDeleteDialog(false) },
        ]}>
        <p>You are going to delete media!<br /> This action cannot be undone.</p>
      </Modal>

    </React.Fragment>
  )
}
