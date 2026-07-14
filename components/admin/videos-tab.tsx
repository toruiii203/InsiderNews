"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import {
  Plus, Edit, Trash2, Play, X, Loader2, RefreshCw, AlertCircle,
  Upload, Link as LinkIcon, ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { categories, type Video } from "@/lib/mock-data"

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "change-me-in-env"

// ─── Media Upload Field (URL + Drag & Drop) ────────────────────────────────
// Same component/behavior as the one in articles-tab.tsx, duplicated here so
// this file works standalone. If you'd rather share one copy, move this into
// its own file (e.g. components/admin/media-upload-field.tsx) and import it
// in both places instead.
const FILE_TYPES = {
  video: {
    accept: "video/mp4,video/webm,video/quicktime,video/x-matroska",
    allowed: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
    errorMsg: "Unsupported file type. Use MP4, WebM, MOV, or MKV.",
    dropLabel: "Drop video here",
    browseHint: "or click to browse • MP4, WEBM, MOV, MKV",
  },
  image: {
    accept: "image/jpeg,image/png,image/webp,image/gif",
    allowed: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    errorMsg: "Unsupported file type. Use JPG, PNG, WEBP, or GIF.",
    dropLabel: "Drop image here",
    browseHint: "or click to browse • JPG, PNG, WEBP, GIF",
  },
} as const

function MediaUploadField({ value, onChange, label, kind = "video" }: {
  value: string
  onChange: (url: string) => void
  label: string
  kind?: "video" | "image"
}) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState("")
  const [tab, setTab] = React.useState<"url" | "upload">("url")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inp = "w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
  const config = FILE_TYPES[kind]

  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadError("")
    try {
      const ext = file.name.split(".").pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const bucket = file.type.startsWith("video/") ? "videos" : "images"
      const res = await fetch(`/api/upload`, {
        method: "POST",
        headers: {
          "x-admin-secret": ADMIN_SECRET,
          "x-filename": filename,
          "x-bucket": bucket,
          "Content-Type": file.type,
        },
        body: file,
      })
      if (!res.ok) {
        onChange(URL.createObjectURL(file))
        setUploadError("Upload API not set up — using local preview only.")
        return
      }
      const data = await res.json()
      onChange(data.url)
    } catch {
      onChange(URL.createObjectURL(file))
      setUploadError("Upload failed — using local preview only.")
    } finally {
      setUploading(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!config.allowed.includes(file.type)) { setUploadError(config.errorMsg); return }
    uploadFile(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files)
  }, [])

  const isVideoValue = kind === "video" && !!(value.match(/\.(mp4|webm|mov|mkv)/i) || value.startsWith("blob:"))
  const isImageValue = kind === "image" && !!value && !isVideoValue

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex rounded-lg border border-input overflow-hidden text-sm">
        <button type="button" onClick={() => setTab("url")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${tab === "url" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}>
          <LinkIcon className="h-3.5 w-3.5" />URL
        </button>
        <button type="button" onClick={() => setTab("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${tab === "upload" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"}`}>
          <Upload className="h-3.5 w-3.5" />Upload / Drop
        </button>
      </div>
      {tab === "url" && (
        <input suppressHydrationWarning type="url" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={kind === "video" ? "https://youtube.com/watch?v=..." : "https://images.unsplash.com/..."}
          className={inp} />
      )}
      {tab === "upload" && (
        <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)} onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed transition-all p-6 flex flex-col items-center gap-2 text-center ${isDragging ? "border-primary bg-primary/10" : "border-input hover:border-primary/50 hover:bg-muted/50"}`}>
          <input ref={fileInputRef} type="file" className="hidden"
            accept={config.accept}
            onChange={e => handleFiles(e.target.files)} />
          {uploading
            ? <><Loader2 className="h-8 w-8 text-primary animate-spin" /><p className="text-sm text-muted-foreground">Uploading…</p></>
            : <><ImageIcon className="h-8 w-8 text-muted-foreground" /><p className="text-sm font-medium">{config.dropLabel}</p><p className="text-xs text-muted-foreground">{config.browseHint}</p></>}
        </div>
      )}
      {uploadError && <p className="text-xs text-amber-600 flex items-start gap-1"><AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />{uploadError}</p>}
      {value && !uploading && (
        <div className="relative rounded-lg overflow-hidden bg-muted h-32">
          {isVideoValue
            ? <video src={value} className="w-full h-full object-cover" muted controls />
            : isImageValue
              ? <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
              : <div className="flex items-center justify-center h-full text-xs text-muted-foreground px-2 text-center">{value}</div>}
          <button type="button" onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Videos Tab ─────────────────────────────────────────────────────────────
export function VideosTab() {
  const [videos, setVideos] = useState<Video[]>([])
  const [fetchStatus, setFetchStatus] = useState<"loading" | "done" | "error">("loading")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)

  const loadVideos = async () => {
    setFetchStatus("loading")
    try {
      const res = await fetch("/api/videos?limit=100", {
        headers: { "x-admin-secret": ADMIN_SECRET },
      })
      const data = await res.json()
      setVideos(data.videos ?? [])
      setFetchStatus("done")
    } catch {
      setFetchStatus("error")
    }
  }

  useEffect(() => { loadVideos() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return
    const res = await fetch("/api/videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setVideos(videos.filter((v) => v.id !== id))
    } else {
      alert("Failed to delete video.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Videos</h1>
        <div className="flex items-center gap-2">
          <Button onClick={loadVideos} variant="outline" size="icon" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${fetchStatus === "loading" ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-[#CE1126] hover:bg-[#CE1126]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>
      </div>

      {(showAddForm || editingVideo) && (
        <VideoForm
          video={editingVideo}
          onClose={() => {
            setShowAddForm(false)
            setEditingVideo(null)
          }}
          onSave={async (video) => {
            const method = editingVideo ? "PATCH" : "POST"
            const res = await fetch("/api/videos", {
              method,
              headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
              body: JSON.stringify(video),
            })
            const data = await res.json()
            if (data.video) {
              if (editingVideo) {
                setVideos(videos.map((v) => (v.id === data.video.id ? data.video : v)))
              } else {
                setVideos([data.video, ...videos])
              }
            } else {
              alert(data.error || "Failed to save video.")
            }
            setShowAddForm(false)
            setEditingVideo(null)
          }}
        />
      )}

      {fetchStatus === "loading" && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading videos...
        </div>
      )}
      {fetchStatus === "error" && (
        <div className="flex items-center justify-center py-16 text-destructive gap-2">
          <AlertCircle className="h-5 w-5" /> Failed to load.
          <button onClick={loadVideos} className="underline text-sm ml-1">Retry</button>
        </div>
      )}
      {fetchStatus === "done" && videos.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No videos yet. Click "Add Video" to create one.
        </div>
      )}
      {fetchStatus === "done" && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative h-40">
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#CE1126] flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-white ml-1" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-1 bg-[#002D72] text-white text-xs rounded">
                    {video.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {video.description}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingVideo(video)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(video.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface VideoFormProps {
  video: Video | null
  onClose: () => void
  onSave: (video: Video) => Promise<void>
}

function VideoForm({ video, onClose, onSave }: VideoFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: video?.title || "",
    description: video?.description || "",
    video_url: video?.video_url || "",
    thumbnail_url:
      video?.thumbnail_url ||
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80",
    category: video?.category || "Nation",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const newVideo: Video = {
      id: video?.id || String(Date.now()),
      ...formData,
      published_at: video?.published_at || new Date().toISOString(),
    }
    await onSave(newVideo)
    setSaving(false)
  }

  const inp = "w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72] text-sm"
  const lbl = "text-sm font-medium text-foreground"

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-md max-h-[92vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b pb-3">
          <CardTitle>{video ? "Edit Video" : "Add New Video"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className={lbl}>Title</label>
              <input suppressHydrationWarning type="text" value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })} required className={inp} />
            </div>

            <div className="space-y-1.5">
              <label className={lbl}>Description</label>
              <textarea suppressHydrationWarning value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} required className={inp} />
            </div>

            {/* Drag & drop OR paste a URL — same dual-tab field used for Articles */}
            <MediaUploadField
              label="Video URL (YouTube/Facebook) or Upload File"
              value={formData.video_url}
              onChange={url => setFormData({ ...formData, video_url: url })}
            />

            <MediaUploadField
              label="Thumbnail URL or Upload Image"
              kind="image"
              value={formData.thumbnail_url}
              onChange={url => setFormData({ ...formData, thumbnail_url: url })}
            />

            <div className="space-y-1.5">
              <label className={lbl}>Category</label>
              <select suppressHydrationWarning value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })} className={inp}>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#002D72] hover:bg-[#001a50] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : video ? "Update Video" : "Add Video"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
