import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

/**
 * Extract YouTube metadata (title, duration in seconds, thumbnail) using yt-dlp.
 * @param {string} url - YouTube URL
 * @returns {Promise<{ title: string, duration: number, thumbnail: string }>}
 */
export async function fetchYoutubeMetadata(url) {
  // 1. Try running `yt-dlp` executable
  try {
    const { stdout } = await execFileAsync(
      'yt-dlp',
      ['--dump-single-json', '--no-playlist', '--no-warnings', '--skip-download', url],
      { timeout: 10000, maxBuffer: 10 * 1024 * 1024 }
    )
    const json = JSON.parse(stdout)
    const duration = Math.round(Number(json.duration) || 0)
    const title = json.title || 'YouTube Video'
    const thumbnail = json.thumbnail || (json.thumbnails && json.thumbnails.length > 0 ? json.thumbnails[json.thumbnails.length - 1].url : null)

    return {
      title,
      duration,
      thumbnail
    }
  } catch (ytErr) {
    const errorText = String(ytErr.stderr || ytErr.stdout || ytErr.message || '')

    // Check specific YouTube errors
    if (
      errorText.includes('Private video') ||
      errorText.includes('Video unavailable') ||
      errorText.includes('Sign in to confirm your age') ||
      errorText.includes('Incomplete YouTube ID')
    ) {
      throw new Error('Video is private, deleted, age-restricted, or unavailable on YouTube.')
    }

    // 2. Try running via `python -m yt_dlp` if standalone binary is invoked via python
    try {
      const { stdout } = await execFileAsync(
        'python',
        ['-m', 'yt_dlp', '--dump-single-json', '--no-playlist', '--no-warnings', '--skip-download', url],
        { timeout: 10000, maxBuffer: 10 * 1024 * 1024 }
      )
      const json = JSON.parse(stdout)
      const duration = Math.round(Number(json.duration) || 0)
      const title = json.title || 'YouTube Video'
      const thumbnail = json.thumbnail || (json.thumbnails && json.thumbnails.length > 0 ? json.thumbnails[json.thumbnails.length - 1].url : null)

      return {
        title,
        duration,
        thumbnail
      }
    } catch (pyErr) {
      const pyErrorText = String(pyErr.stderr || pyErr.stdout || pyErr.message || '')
      if (
        pyErrorText.includes('Private video') ||
        pyErrorText.includes('Video unavailable') ||
        pyErrorText.includes('Sign in to confirm your age')
      ) {
        throw new Error('Video is private, deleted, age-restricted, or unavailable on YouTube.')
      }

      // 3. Fallback to oEmbed for title & thumbnail if yt-dlp is unavailable on local system
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json()
          return {
            title: oembedData.title || 'YouTube Video',
            duration: 0,
            thumbnail: oembedData.thumbnail_url || null,
            warning: 'yt-dlp is not installed or failed, fallback to oEmbed.'
          }
        }
      } catch (oembedErr) {
        // oembed failed
      }

      throw new Error('Could not fetch YouTube video metadata. Please ensure yt-dlp is installed and the video is public.')
    }
  }
}
