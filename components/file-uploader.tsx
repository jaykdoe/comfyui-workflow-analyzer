"use client"

import type React from "react"

import { forwardRef } from "react"
import { Upload } from "lucide-react"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
}

export const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(({ onFileUpload }, ref) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith(".json")) {
        onFileUpload(file)
      } else {
        alert("Please upload a JSON file")
      }
    }
  }

  return (
    <div
      className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer bg-gray-900"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => (ref as React.RefObject<HTMLInputElement>).current?.click()}
    >
      <input
        type="file"
        ref={ref}
        className="hidden"
        accept=".json"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileUpload(e.target.files[0])
          }
        }}
      />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-200">Upload ComfyUI Workflow</h3>
      <p className="mt-1 text-sm text-gray-400">
        Drag and drop your ComfyUI workflow JSON file here, or click to browse
      </p>
    </div>
  )
})

FileUploader.displayName = "FileUploader"
