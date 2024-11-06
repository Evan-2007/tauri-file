'use client'

import {useDownloadStore} from '@/hooks/useDownloadStore';


import { Download, CheckCircle, Pause } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {invoke } from '@tauri-apps/api/core'
import {useEffect } from 'react'

type Download = {
  id: number;
  url: string;
  is_downloaded: string;
  status: string;
  path: string;
}

type DownloadStatusCardProps = {
  downloads: Download[]
}



export function Downloads() {

  const saveDownload = useDownloadStore((state) => state.addDownload)

    useEffect(() => {
        setInterval(() => {
            invoke('get_all_downloads').then((downloads: unknown) => {
                const downloadList = downloads as Download[];
                downloadList.forEach((download: Download) => {
                    saveDownload(download)

                })
            })
        }, 1000);
    }, [])
    

    const downloads: Download[] = useDownloadStore((state) => state.downloads)

  const getStatusIcon = (status: Download['status']) => {
    switch (status) {
      case 'downloading':
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: Download['status']) => {
    switch (status) {
      case 'downloading':
        return 'bg-white text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Download Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {downloads.map((download) => (
            <li key={download.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(download.is_downloaded ? 'completed' : 'downloading')}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{download.url}</p>
                  <p className="text-xs text-gray-500">ID: {download.id}</p>
                </div>
              </div>
              <Badge className={`${getStatusColor(download.is_downloaded ? 'completed' : 'downloading')} bg-transparent capitalize`}>
                {download.is_downloaded ? 'completed' : <Status status={download.status} />}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}




import React from 'react'

interface StatusIndicatorProps {
  status: string
}

function Status({ status = '0MB/100MB' }: StatusIndicatorProps) {
  const [current, total] = status.split('/').map(s => parseFloat(s))
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="flex flex-col items-center bg-transparent">
      <div className="relative w-8 h-8 bg-transparent">
        <svg className="w-full h-full" viewBox="0 0 100 100 " >

          <circle
            className="text-blue-500 transition-all duration-300 ease-in-out "
            strokeWidth="10"
            strokeDasharray={`${percentage * 2.83} 283`}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>
      <span className="mt-1 text-xs font-medium text-black" aria-live="polite">
        {status}
      </span> 
    </div>
  )
}