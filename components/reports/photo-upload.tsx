'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  userId: string
  onUpload: (url: string) => void
}

export function PhotoUpload({ userId, onUpload }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const { getFirebaseApp } = await import('@/lib/firebase/client')
      const storage = getStorage(getFirebaseApp())
      const storageRef = ref(storage, `price-evidence/${userId}/${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      onUpload(url)
    } catch {
      // Photo optional — silently fail, user can still submit without it
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-fuel-green transition-colors"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Price evidence" className="mx-auto max-h-40 rounded object-contain" />
      ) : (
        <div className="text-muted text-sm">
          <div className="text-2xl mb-1">📷</div>
          {uploading ? 'Uploading...' : 'Drag & drop or click to upload photo'}
        </div>
      )}
    </div>
  )
}
