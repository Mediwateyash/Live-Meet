import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execFileAsync = promisify(execFile)

const BIN_DIR = path.resolve(process.cwd(), 'bin')
const IS_WIN = process.platform === 'win32'
const LOCAL_BIN_NAME = IS_WIN ? 'yt-dlp.exe' : 'yt-dlp'
const LOCAL_BIN_PATH = path.join(BIN_DIR, LOCAL_BIN_NAME)

/**
 * Extract YouTube video ID from standard YouTube URLs.
 */
export function extractVideoId(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

/**
 * Parse duration strings like "03:33" or "01:02:15" into total seconds.
 */
function parseDurationString(str) {
  if (!str || typeof str !== 'string') return 0
  const parts = str.trim().split(':').map(p => parseInt(p, 10))
  if (parts.some(isNaN)) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return 0
}

/**
 * Robustly extract duration in seconds from any yt-dlp / YouTube JSON metadata structure.
 */
function extractDurationFromObject(obj) {
  if (!obj) return 0

  // 1. Direct numeric duration (in seconds)
  if (typeof obj.duration === 'number' && !isNaN(obj.duration) && obj.duration > 0) {
    return Math.round(obj.duration)
  }

  // 2. Stringified numeric duration
  if (obj.duration && !isNaN(Number(obj.duration)) && Number(obj.duration) > 0) {
    return Math.round(Number(obj.duration))
  }

  // 3. Formatted duration string (e.g. "03:33" or "1:15:40")
  if (obj.duration_string) {
    const parsed = parseDurationString(obj.duration_string)
    if (parsed > 0) return parsed
  }

  // 4. lengthSeconds / length_seconds field
  const lenSec = obj.lengthSeconds || obj.length_seconds || obj.videoDetails?.lengthSeconds
  if (lenSec && !isNaN(Number(lenSec)) && Number(lenSec) > 0) {
    return Math.round(Number(lenSec))
  }

  // 5. approxDurationMs field
  const approxMs = obj.approxDurationMs || obj.approx_duration_ms
  if (approxMs && !isNaN(Number(approxMs)) && Number(approxMs) > 0) {
    return Math.round(Number(approxMs) / 1000)
  }

  return 0
}

/**
 * Resolve best yt-dlp binary path or auto-download standalone binary if missing.
 */
async function getExecutablePath() {
  if (fs.existsSync(LOCAL_BIN_PATH)) return LOCAL_BIN_PATH

  const commonPaths = [
    '/opt/render/.local/bin/yt-dlp',
    path.join(os.homedir(), '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ]

  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p
  }

  try {
    const whichCmd = IS_WIN ? 'where' : 'which'
    const { stdout } = await execFileAsync(whichCmd, ['yt-dlp'])
    const resolved = stdout.trim().split(/\r?\n/)[0]?.trim()
    if (resolved && fs.existsSync(resolved)) return resolved
  } catch {
    // Not in PATH
  }

  // Auto-download standalone binary if missing
  try {
    console.log('[YouTubeService] yt-dlp binary not found. Auto-downloading standalone binary...')
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true })

    const downloadUrl = IS_WIN
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

    const res = await fetch(downloadUrl)
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(LOCAL_BIN_PATH, buffer)
      if (!IS_WIN) fs.chmodSync(LOCAL_BIN_PATH, 0o755)
      console.log('[YouTubeService] Standalone yt-dlp ready at:', LOCAL_BIN_PATH)
      return LOCAL_BIN_PATH
    }
  } catch (dlErr) {
    console.error('[YouTubeService] Auto-download of yt-dlp failed:', dlErr.message)
  }

  return 'yt-dlp'
}

/**
 * Print yt-dlp version.
 */
async function getYtDlpVersion(binaryPath) {
  try {
    const { stdout } = await execFileAsync(binaryPath, ['--version'])
    return stdout.trim()
  } catch {
    return 'unknown'
  }
}

/**
 * Direct web scraping fallback for public YouTube video metadata.
 */
async function fetchDirectYoutubeMeta(url) {
  const videoId = extractVideoId(url)
  if (!videoId) return null

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
  const response = await fetch(watchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  })

  if (!response.ok) return null
  const html = await response.text()

  let duration = 0
  const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/)
  if (lengthMatch) {
    duration = parseInt(lengthMatch[1], 10)
  } else {
    const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/)
    if (approxMatch) {
      duration = Math.round(parseInt(approxMatch[1], 10) / 1000)
    }
  }

  let title = 'YouTube Video'
  const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i)
  if (titleMatch) {
    title = titleMatch[1].replace(/ - YouTube$/, '').trim()
  }

  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return { title, duration, thumbnail }
}

/**
 * Extract YouTube metadata (title, duration in seconds, thumbnail) using yt-dlp.
 */
export async function fetchYoutubeMetadata(url) {
  const videoId = extractVideoId(url)
  const startTime = Date.now()
  const binaryPath = await getExecutablePath()
  const ytDlpVersion = await getYtDlpVersion(binaryPath)
  const args = ['--dump-single-json', '--no-playlist', '--no-warnings', '--skip-download', url]

  console.log('[YouTubeService:Executing]', {
    binaryPath,
    ytDlpVersion,
    platform: process.platform,
    command: `${binaryPath} ${args.join(' ')}`
  })

  // 1. Primary: Executing resolved yt-dlp binary
  try {
    const { stdout, stderr } = await execFileAsync(binaryPath, args, {
      timeout: 15000,
      maxBuffer: 10 * 1024 * 1024
    })
    const execTimeMs = Date.now() - startTime

    console.log('[YouTubeService:RawytDlpOutput]', stdout)
    console.log('[YouTubeService:ExecutionDetails]', {
      command: `${binaryPath} ${args.join(' ')}`,
      resolvedPath: binaryPath,
      ytDlpVersion,
      execTimeMs,
      exitCode: 0,
      stderr: stderr || null
    })

    const json = JSON.parse(stdout)
    const duration = extractDurationFromObject(json)
    const title = json.title || 'YouTube Video'
    const thumbnail = json.thumbnail || (json.thumbnails && json.thumbnails.length > 0 ? json.thumbnails[json.thumbnails.length - 1].url : null)

    if (duration > 0) {
      const result = { title, duration, thumbnail, videoId }
      console.log('[YouTubeService:Response]', result)
      return result
    } else {
      console.warn('[YouTubeService:Warning] yt-dlp returned 0 duration from JSON. Falling back to web scraper...')
    }
  } catch (err) {
    const execTimeMs = Date.now() - startTime
    const stdoutStr = String(err.stdout || '')
    const stderrStr = String(err.stderr || err.message || '')

    console.error('[YouTubeService:ytDlpExecutionFailed]', {
      command: `${binaryPath} ${args.join(' ')}`,
      resolvedPath: binaryPath,
      ytDlpVersion,
      execTimeMs,
      exitCode: err.code || null,
      stdout: stdoutStr,
      stderr: stderrStr,
      errorMessage: err.message
    })

    if (
      stderrStr.includes('Private video') ||
      stderrStr.includes('Video unavailable') ||
      stderrStr.includes('Sign in to confirm your age') ||
      stderrStr.includes('Incomplete YouTube ID')
    ) {
      throw new Error('Video is private, deleted, age-restricted, or unavailable on YouTube.')
    }
  }

  // 2. Direct Web Scraper Fallback (Parses lengthSeconds from YouTube HTML)
  try {
    const scrapeStartTime = Date.now()
    const scrapedMeta = await fetchDirectYoutubeMeta(url)
    if (scrapedMeta && scrapedMeta.duration > 0) {
      const result = {
        title: scrapedMeta.title,
        duration: scrapedMeta.duration,
        thumbnail: scrapedMeta.thumbnail,
        videoId
      }
      console.log('[YouTubeService:ScrapeSuccessResponse]', {
        execTimeMs: Date.now() - scrapeStartTime,
        ...result
      })
      return result
    }
  } catch (scrapeErr) {
    console.error('[YouTubeService:ScrapeError]', scrapeErr.message)
  }

  // If duration is 0 or missing, throw explicit error (NEVER return duration = 0 silently)
  throw new Error(`Failed to extract valid video duration for ${url}. Please verify the YouTube URL is a public video.`)
}
