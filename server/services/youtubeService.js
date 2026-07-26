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
 * Supports: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed
 */
export function extractVideoId(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

/**
 * Resolve best yt-dlp binary path or auto-download standalone binary if missing.
 */
async function getExecutablePath() {
  // 1. Check local bin directory
  if (fs.existsSync(LOCAL_BIN_PATH)) return LOCAL_BIN_PATH

  // 2. Check common Linux paths (Render, etc.)
  const commonPaths = [
    '/opt/render/.local/bin/yt-dlp',
    path.join(os.homedir(), '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ]
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p
  }

  // 3. Check system PATH
  try {
    const whichCmd = IS_WIN ? 'where' : 'which'
    const { stdout } = await execFileAsync(whichCmd, ['yt-dlp'])
    const resolved = stdout.trim().split(/\r?\n/)[0]?.trim()
    if (resolved && fs.existsSync(resolved)) return resolved
  } catch {
    // Not in PATH
  }

  // 4. Auto-download standalone binary
  try {
    console.log('[YouTubeService] yt-dlp not found anywhere. Auto-downloading standalone binary...')
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true })

    const downloadUrl = IS_WIN
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

    const res = await fetch(downloadUrl)
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(LOCAL_BIN_PATH, buffer)
      if (!IS_WIN) fs.chmodSync(LOCAL_BIN_PATH, 0o755)
      console.log('[YouTubeService] Standalone yt-dlp downloaded to:', LOCAL_BIN_PATH)
      return LOCAL_BIN_PATH
    } else {
      console.error('[YouTubeService] Download failed with status:', res.status)
    }
  } catch (dlErr) {
    console.error('[YouTubeService] Auto-download failed:', dlErr.message)
  }

  // 5. Last resort — hope it's on PATH
  return 'yt-dlp'
}

/**
 * Extract YouTube metadata (title, duration in seconds, thumbnail) using yt-dlp.
 *
 * This is the ONLY exported function. It:
 * 1. Normalizes the URL to strip playlist params
 * 2. Runs yt-dlp with --extractor-args to bypass bot detection
 * 3. Falls back to direct YouTube HTML scraping if yt-dlp fails
 * 4. NEVER returns duration=0 silently
 * 5. ALWAYS surfaces the real error
 */
export async function fetchYoutubeMetadata(url) {
  const videoId = extractVideoId(url)
  if (!videoId) {
    throw new Error(`Cannot extract video ID from URL: ${url}`)
  }

  // ── Step 1: Normalize URL ──────────────────────────────────────────
  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`

  // ── Step 2: Resolve binary ─────────────────────────────────────────
  const binaryPath = await getExecutablePath()

  // ── Step 3: Get version for logging ────────────────────────────────
  let ytDlpVersion = 'unknown'
  try {
    const { stdout } = await execFileAsync(binaryPath, ['--version'])
    ytDlpVersion = stdout.trim()
  } catch {}

  // ── Step 4: Build command ──────────────────────────────────────────
  const args = [
    '--dump-single-json',
    '--no-playlist',
    '--no-warnings',
    '--skip-download',
    '--extractor-args', 'youtube:player_client=android,ios,web',
    cleanUrl
  ]

  const debugInfo = {
    incomingUrl: url,
    normalizedUrl: cleanUrl,
    videoId,
    binaryPath,
    ytDlpVersion,
    os: `${process.platform} ${process.arch}`,
    command: [binaryPath, ...args].join(' ')
  }

  console.log('[YouTubeService:REQUEST]', JSON.stringify(debugInfo, null, 2))

  // ── Step 5: Execute yt-dlp ─────────────────────────────────────────
  const startTime = Date.now()
  let ytdlpResult = null
  let ytdlpError = null

  try {
    const { stdout, stderr } = await execFileAsync(binaryPath, args, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    })

    const execTimeMs = Date.now() - startTime

    console.log('[YouTubeService:EXEC_OK]', {
      exitCode: 0,
      execTimeMs,
      stdoutLength: stdout?.length || 0,
      stderr: stderr || '(empty)'
    })

    // ── Step 6: Parse JSON ───────────────────────────────────────────
    const json = JSON.parse(stdout)

    const title = json.title || 'YouTube Video'
    const duration = (typeof json.duration === 'number' && json.duration > 0)
      ? Math.round(json.duration)
      : 0
    const thumbnail = json.thumbnail
      || (json.thumbnails?.length ? json.thumbnails[json.thumbnails.length - 1].url : null)
      || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

    console.log('[YouTubeService:PARSED]', {
      _type: json._type || 'video',
      title,
      duration,
      durationRaw: json.duration,
      durationType: typeof json.duration,
      thumbnail,
      videoId
    })

    if (duration > 0) {
      const result = { title, duration, thumbnail, videoId }
      console.log('[YouTubeService:RESPONSE]', result)
      return result
    }

    // duration was 0 in the JSON — this should never happen for a real video
    ytdlpError = `yt-dlp returned duration=0 (raw value: ${json.duration})`

  } catch (err) {
    const execTimeMs = Date.now() - startTime
    const stderrStr = String(err.stderr || '')
    const stdoutStr = String(err.stdout || '')

    console.error('[YouTubeService:EXEC_FAILED]', {
      exitCode: err.code || err.status || null,
      signal: err.signal || null,
      execTimeMs,
      errorMessage: err.message,
      stderr: stderrStr || '(empty)',
      stdout: stdoutStr || '(empty)'
    })

    // Extract the real yt-dlp error from stderr
    ytdlpError = stderrStr.trim() || err.message
  }

  // ── Step 7: Fallback — direct YouTube HTML scrape ──────────────────
  console.log('[YouTubeService:FALLBACK] yt-dlp failed, trying direct HTML scrape. Reason:', ytdlpError)

  try {
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    if (!response.ok) {
      throw new Error(`YouTube returned HTTP ${response.status}`)
    }

    const html = await response.text()

    // Extract duration
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

    // Extract title
    let title = 'YouTube Video'
    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i)
      || html.match(/<title>([^<]+)<\/title>/i)
    if (titleMatch) {
      title = titleMatch[1].replace(/ - YouTube$/, '').trim()
    }

    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

    console.log('[YouTubeService:SCRAPE_RESULT]', { title, duration, thumbnail, videoId })

    if (duration > 0) {
      const result = { title, duration, thumbnail, videoId }
      console.log('[YouTubeService:RESPONSE_VIA_SCRAPE]', result)
      return result
    }

    // Scrape also returned 0 duration
    throw new Error(`HTML scrape also returned duration=0. YouTube may be blocking this server's IP.`)

  } catch (scrapeErr) {
    console.error('[YouTubeService:SCRAPE_FAILED]', scrapeErr.message)
  }

  // ── Step 8: Both methods failed — throw REAL error ─────────────────
  const errorMsg = `yt-dlp error: ${ytdlpError}`
  console.error('[YouTubeService:FINAL_ERROR]', errorMsg)
  throw new Error(errorMsg)
}
