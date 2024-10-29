'use client'
import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import {Downloads} from '@/components/downloads'



export default function FileUpload() {


  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-background">


        <URLInput />
        <Downloads />
    </div>
  )
}


import {invoke } from '@tauri-apps/api/core'

function URLInput() {
  const [url, setUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }

  const submitUrl = async() => {
      setMessage("Loading...")
      await invoke('download_file', { url: url, path: '../game.zip' })
  
  }
  

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-background">
      <input
        type="text"
        value={url || ''}
        onChange={handleUrlChange}
        className="p-2 border rounded-lg bg-background"
        placeholder="Enter URL"
      />
      <Button onClick={() => setUrl(null)} variant="outline"> 
        Clear
      </Button>
      <Button onClick={() => submitUrl()} variant="outline">
        Submit
      </Button>
      {/* <input type="file" webkitdirectory='true' mozdirectory /> */}
    </div>
  )
}