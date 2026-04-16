export interface Article {
  id: string
  title: string
  content: string
  excerpt: string
  category: string
  author: string
  published_at: string
  image_url: string
  language: 'EN' | 'FIL'
  is_breaking: boolean
  view_count: number
  reading_time: number
  tags: string[]
}

export interface Video {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  category: string
  published_at: string
}

export const categories = [
  { name: 'Nation', slug: 'nation', color: 'bg-[#002D72]' },
  { name: 'Regions', slug: 'regions', color: 'bg-[#CE1126]' },
  { name: 'Feature', slug: 'feature', color: 'bg-[#FCD116] text-black' },
  { name: 'Metro', slug: 'metro', color: 'bg-slate-700' },
  { name: 'Business', slug: 'business', color: 'bg-emerald-700' },
  { name: 'Entertainment', slug: 'entertainment', color: 'bg-purple-700' },
  { name: 'International', slug: 'international', color: 'bg-sky-700' },
  { name: 'Tourism', slug: 'tourism', color: 'bg-teal-700' },
]

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Senate Probe Reveals Undisclosed Offshore Accounts in Bangsamoro Deal',
    content: 'Senators demand answers as documents surface linking officials to foreign transactions totaling ₱2.3 billion. The Senate blue ribbon committee has launched a full investigation after whistleblowers submitted sworn statements alongside financial records.',
    excerpt: 'Senators demand answers as documents surface linking officials to foreign transactions totaling ₱2.3 billion.',
    category: 'Nation',
    author: 'Maria Santos',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    language: 'EN',
    is_breaking: true,
    view_count: 15420,
    reading_time: 5,
    tags: ['senate', 'bangsamoro', 'investigation']
  },
  {
    id: '2',
    title: 'President Signs ₱6.3T National Budget into Law Amid Calls for Transparency',
    content: 'Civil society groups urge immediate publication of full budget line items, citing recent audit findings. The signing ceremony at Malacañang was attended by cabinet members and select lawmakers from both chambers.',
    excerpt: 'Civil society groups urge immediate publication of full budget line items following the historic signing.',
    category: 'Nation',
    author: 'Juan dela Cruz',
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=800&q=80',
    language: 'EN',
    is_breaking: true,
    view_count: 8932,
    reading_time: 4,
    tags: ['budget', 'government', 'transparency']
  },
  {
    id: '3',
    title: 'Typhoon Signal No. 2 Raised Over Eastern Visayas as Storm Approaches',
    content: 'PAGASA has raised Typhoon Warning Signal No. 2 over Eastern Visayas provinces as the tropical storm is expected to make landfall within 24 hours. Residents are urged to evacuate low-lying areas immediately.',
    excerpt: 'PAGASA warns of strong winds and heavy rains as tropical storm is expected to make landfall.',
    category: 'Regions',
    author: 'Paolo Reyes',
    published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80',
    language: 'EN',
    is_breaking: true,
    view_count: 45230,
    reading_time: 3,
    tags: ['typhoon', 'visayas', 'pagasa']
  },
  {
    id: '4',
    title: 'MMDA Launches New Anti-Flooding System for Metro Manila',
    content: 'The Metropolitan Manila Development Authority unveiled a ₱800 million smart drainage system that uses AI sensors to predict and prevent flooding in 12 critical areas across the metropolis.',
    excerpt: 'Smart drainage system using AI sensors to prevent flooding in 12 critical metro areas.',
    category: 'Metro',
    author: 'Ana Reyes',
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
    language: 'EN',
    is_breaking: false,
    view_count: 7621,
    reading_time: 4,
    tags: ['mmda', 'flooding', 'metro manila']
  },
  {
    id: '5',
    title: 'Philippine Stock Exchange Reaches All-Time High Amid Foreign Investment Surge',
    content: 'The Philippine Stock Exchange Index (PSEi) closed at a historic high of 8,500 points as foreign investors pour billions into local markets.',
    excerpt: 'PSEi closes at record 8,500 points as foreign investments flood Philippine markets.',
    category: 'Business',
    author: 'Carlos Mendoza',
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    language: 'EN',
    is_breaking: false,
    view_count: 9200,
    reading_time: 5,
    tags: ['stocks', 'psei', 'economy']
  },
  {
    id: '6',
    title: 'Vice Ganda and Anne Curtis Reunite for ABS-CBN Anniversary Special',
    content: 'After years apart, the iconic comedy duo confirms their return for a prime-time special broadcast marking the network\'s milestone anniversary celebration.',
    excerpt: 'Comedy duo confirms return for prime-time special marking the network anniversary.',
    category: 'Entertainment',
    author: 'Lea Torres',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    language: 'EN',
    is_breaking: false,
    view_count: 38000,
    reading_time: 3,
    tags: ['entertainment', 'abs-cbn', 'showbiz']
  },
  {
    id: '7',
    title: 'UN General Assembly Backs Philippines in West Philippine Sea Dispute',
    content: 'A landmark resolution co-sponsored by 67 nations reaffirms the 2016 arbitral ruling in favor of the Philippines, dealing a diplomatic blow to China\'s territorial claims.',
    excerpt: '67 nations co-sponsor landmark resolution reaffirming 2016 arbitral ruling for the Philippines.',
    category: 'International',
    author: 'Rico Santos',
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&q=80',
    language: 'EN',
    is_breaking: true,
    view_count: 52000,
    reading_time: 6,
    tags: ['wps', 'un', 'international']
  },
  {
    id: '8',
    title: 'Palawan Named World\'s Best Island Destination for 5th Consecutive Year',
    content: 'Travel + Leisure magazine has once again crowned Palawan as the world\'s best island, praising its crystal-clear waters, pristine beaches, and thriving ecotourism programs.',
    excerpt: 'Travel+Leisure magazine crowns Palawan for the fifth straight year amid ecotourism boom.',
    category: 'Tourism',
    author: 'Grace Villanueva',
    published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80',
    language: 'EN',
    is_breaking: false,
    view_count: 28700,
    reading_time: 4,
    tags: ['palawan', 'tourism', 'travel']
  },
  {
    id: '9',
    title: 'The Rise of Bangsamoro: How Mindanao\'s Newest Region Is Building Peace',
    content: 'An in-depth look at how the Bangsamoro Autonomous Region in Muslim Mindanao has transformed over three years of self-governance, with economic growth outpacing national averages.',
    excerpt: 'A deep dive into three years of self-governance and economic growth in BARMM.',
    category: 'Feature',
    author: 'Maria Santos',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
    language: 'EN',
    is_breaking: false,
    view_count: 14200,
    reading_time: 8,
    tags: ['bangsamoro', 'mindanao', 'peace']
  },
]

export const mockVideos: Video[] = [
  {
    id: 'v1',
    title: 'President Signs Historic Climate Action Bill',
    description: 'Full coverage of the ceremonial signing at Malacañang Palace.',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    category: 'Nation',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'v2',
    title: 'Typhoon Update: Live Coverage from Eastern Visayas',
    description: 'Real-time updates as the typhoon approaches the eastern coastline.',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80',
    category: 'Regions',
    published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
]

export function getCategoryColor(category: string): string {
  const cat = categories.find(c => c.name.toLowerCase() === category.toLowerCase())
  return cat?.color || 'bg-[#002D72]'
}

export function getRelativeTime(isoString: string): string {
  const now = new Date()
  const date = new Date(isoString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
}
