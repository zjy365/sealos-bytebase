import request from '@/service/request'
import useSessionStore from '@/stores/session'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createSealosApp, sealosApp } from 'sealos-desktop-sdk/app'
import styles from './index.module.scss'

export default function Index() {
  const { setSession } = useSessionStore()
  const [url, setUrl] = useState('')

  useEffect(() => {
    return createSealosApp()
  }, [])

  useEffect(() => {
    const initApp = async () => {
      try {
        const result = await sealosApp.getUserInfo()
        setSession(result)
      } catch (error) {}
    }
    initApp()
  }, [setSession])

  const { data, refetch } = useQuery(
    ['applyApp'],
    () => request.post('/api/apply'),
    {
      onSuccess: (data) => {
        if (data?.data?.code === 200) {
          setUrl(data?.data?.data)
        }
        if (data?.data?.code === 201) {
          refetch()
        }
      },
      onError: (err) => {
        console.log(err, 'err')
      },
      retry: 3,
    }
  )

  return (
    <div className={styles.container}>
      {!!url && (
        <iframe
          src={url}
          allow="camera;microphone;clipboard-write;"
          className={styles.iframeWrap}
        />
      )}
    </div>
  )
}
