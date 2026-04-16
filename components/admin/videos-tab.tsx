"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Edit, Trash2, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockVideos, categories, type Video } from "@/lib/mock-data"

export function VideosTab() {
  const [videos, setVideos] = useState<Video[]>(mockVideos)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this video?")) {
      setVideos(videos.filter(v => v.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">Videos</h1>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-[#CE1126] hover:bg-[#CE1126]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* Video Form Modal */}
      {(showAddForm || editingVideo) && (
        <VideoForm 
          video={editingVideo}
          onClose={() => {
            setShowAddForm(false)
            setEditingVideo(null)
          }}
          onSave={(video) => {
            if (editingVideo) {
              setVideos(videos.map(v => v.id === video.id ? video : v))
            } else {
              setVideos([video, ...videos])
            }
            setShowAddForm(false)
            setEditingVideo(null)
          }}
        />
      )}

      {/* Videos Grid */}
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
    </div>
  )
}

interface VideoFormProps {
  video: Video | null
  onClose: () => void
  onSave: (video: Video) => void
}

function VideoForm({ video, onClose, onSave }: VideoFormProps) {
  const [formData, setFormData] = useState({
    title: video?.title || "",
    description: video?.description || "",
    video_url: video?.video_url || "",
    thumbnail_url: video?.thumbnail_url || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80",
    category: video?.category || "Politics",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newVideo: Video = {
      id: video?.id || String(Date.now()),
      ...formData,
      published_at: video?.published_at || new Date().toISOString(),
    }
    
    onSave(newVideo)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{video ? "Edit Video" : "Add New Video"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input suppressHydrationWarning
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea suppressHydrationWarning
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Video URL (YouTube/Facebook)</label>
              <input suppressHydrationWarning
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Thumbnail URL</label>
              <input suppressHydrationWarning
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select suppressHydrationWarning
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#002D72]"
              >
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#002D72] hover:bg-[#002D72]/90 text-white">
                {video ? "Update Video" : "Add Video"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
