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
      className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center cursor-pointer hover:border-[#9ca3af] hover:bg-muted/50 transition-colors"
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
        <img src={preview} alt="Price evidence" className="mx-auto max-h-40 object-contain rounded-md" />
      ) : (
        <div className="text-muted-foreground">
          <i className="ri-camera-3-line text-3xl mb-2 block" />
          <span className="text-sm">
            {uploading ? 'Uploading...' : 'Drag & drop or click to upload photo'}
          </span>
          <p className="text-xs mt-1 text-muted-foreground/70">Optional — helps confirm the price</p>
        </div>
      )}
    </div>
  )
}
