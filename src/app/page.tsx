'use client'
import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import {Downloads} from '@/components/downloads'



export default function FileUpload() {


  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileName(file ? file.name : null)  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const submitFile = async() => {
    if (!fileInputRef.current?.files?.[0]) {
      return
    }
    const file = new Uint8Array(fileInputRef.current?.files?.[0].arrayBuffer()) 
    try {
      await writeTextFile(fileName, file, { baseDir: BaseDirectory.AppConfig })
    } catch (error) {
      console.error(error)
      console.log('Error writing file')
      setFileName("Error")
    }
  }

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
    </div>
  )
}