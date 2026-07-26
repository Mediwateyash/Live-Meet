/**
 * YouTube Metadata Service using official YouTube Data API v3.
 * Fetches video title, duration (in seconds), and thumbnail URL.
 */

/**
 * Extract YouTube video ID from standard YouTube URLs.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&list=...
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

/**
 * Parse ISO 8601 duration strings like "PT1H15M20S", "PT3M33S", "PT45S" into total seconds.
 */
export function parseISO8601Duration(isoDuration) {
  if (!isoDuration || typeof isoDuration !== 'string') return 0
  const match = isoDuration.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i)
  if (!match) return 0
  const days = parseInt(match[1] || '0', 10)
  const hours = parseInt(match[2] || '0', 10)
  const minutes = parseInt(match[3] || '0', 10)
  const seconds = parseInt(match[4] || '0', 10)
  return days * 86400 + hours * 3600 + minutes * 60 + seconds
}

/**
 * Fetch video metadata (title, duration in seconds, thumbnail) from YouTube Data API v3.
 * @param {string} url - The YouTube video URL.
 * @returns {Promise<{ title: string, duration: number, thumbnail: string, videoId: string }>}
 */
export async function fetchYoutubeMetadata(url) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_youtube_data_api_v3_key')) {
    throw new Error('YOUTUBE_API_KEY is not configured in server environment variables.')
  }

  const videoId = extractVideoId(url)
  if (!videoId) {
    throw new Error(`Invalid YouTube URL format. Could not extract Video ID from: ${url}`)
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey.trim())}`

  let response
  try {
    response = await fetch(apiUrl)
  } catch (netErr) {
    throw new Error(`Failed to connect to YouTube Data API: ${netErr.message}`)
  }

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null)
    const reason = errorJson?.error?.errors?.[0]?.reason
    const message = errorJson?.error?.message

    if (response.status === 400 || reason === 'keyInvalid') {
      throw new Error('Invalid YouTube API key. Please verify your YOUTUBE_API_KEY configuration.')
    }
    if (response.status === 403 || reason === 'quotaExceeded') {
      throw new Error('YouTube API quota exceeded or request forbidden. Please try again later.')
    }
    throw new Error(message || `YouTube API request failed with status code ${response.status}.`)
  }

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    throw new Error(`Video not found or unavailable. The video may be private, deleted, or invalid.`)
  }

  const item = data.items[0]
  const snippet = item.snippet || {}
  const contentDetails = item.contentDetails || {}

  const title = snippet.title || 'YouTube Video'

  // Extract highest resolution thumbnail available
  const thumbnails = snippet.thumbnails || {}
  const thumbnail = thumbnails.maxres?.url
    || thumbnails.high?.url
    || thumbnails.medium?.url
    || thumbnails.default?.url
    || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  // Parse ISO 8601 duration string into seconds
  const isoDuration = contentDetails.duration
  const duration = parseISO8601Duration(isoDuration)

  if (duration <= 0) {
    throw new Error(`Could not determine a valid duration for video ID ${videoId}.`)
  }

  return {
    title,
    duration,
    thumbnail,
    videoId
  }
}
