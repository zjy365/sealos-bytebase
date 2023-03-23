import request from '@/service/request'
import useSessionStore from '@/stores/session'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { createSealosApp, sealosApp } from 'sealos-desktop-sdk/app'
import styles from './index.module.scss'

export default function Index() {
  const { setSession, isUserLogin } = useSessionStore()
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

  const { data, isLoading, refetch, isError } = useQuery(
    ['applyApp'],
    () => request.post('/api/apply'),
    {
      onSuccess: (data) => {
        if (data?.data?.code === 200) {
          // window.location.replace(data?.data?.data)
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
      retryDelay: (attemptIndex) => Math.min(1000 * attemptIndex, 2000),
    }
  )
  if (isLoading) {
    return <div className={clsx(styles.loading, styles.err)}>loading</div>
  }

  if (isError) {
    return (
      <div className={styles.err}>
        please go to &nbsp;<a href="https://cloud.sealos.io/">sealos</a>
      </div>
    )
  }

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
