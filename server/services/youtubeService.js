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
function extractVideoId(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

/**
 * Resolve the best yt-dlp binary path or auto-download standalone binary if missing.
 */
async function getExecutablePath() {
  // 1. Check local project bin/ folder
  if (fs.existsSync(LOCAL_BIN_PATH)) {
    return LOCAL_BIN_PATH
  }

  // 2. Check common Linux/Render user bin paths
  const commonPaths = [
    '/opt/render/.local/bin/yt-dlp',
    path.join(os.homedir(), '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ]

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  // 3. Check system PATH via which/where
  try {
    const whichCmd = IS_WIN ? 'where' : 'which'
    const { stdout } = await execFileAsync(whichCmd, ['yt-dlp'])
    const resolved = stdout.trim().split(/\r?\n/)[0]?.trim()
    if (resolved && fs.existsSync(resolved)) {
      return resolved
    }
  } catch {
    // Not found in system PATH
  }

  // 4. Auto-download standalone yt-dlp binary if missing in system & local
  try {
    console.log('[YouTubeService] yt-dlp binary not found. Auto-downloading standalone binary...')
    if (!fs.existsSync(BIN_DIR)) {
      fs.mkdirSync(BIN_DIR, { recursive: true })
    }

    const downloadUrl = IS_WIN
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

    const res = await fetch(downloadUrl)
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(LOCAL_BIN_PATH, buffer)

      if (!IS_WIN) {
        fs.chmodSync(LOCAL_BIN_PATH, 0o755)
      }

      console.log('[YouTubeService] Standalone yt-dlp binary ready at:', LOCAL_BIN_PATH)
      return LOCAL_BIN_PATH
    }
  } catch (dlErr) {
    console.error('[YouTubeService] Auto-download of yt-dlp failed:', dlErr.message)
  }

  return 'yt-dlp'
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

  return {
    title,
    duration,
    thumbnail
  }
}

/**
 * Extract YouTube metadata (title, duration in seconds, thumbnail) using yt-dlp.
 * @param {string} url - YouTube URL
 * @returns {Promise<{ title: string, duration: number, thumbnail: string }>}
 */
export async function fetchYoutubeMetadata(url) {
  const startTime = Date.now()
  const binaryPath = await getExecutablePath()
  const args = ['--dump-single-json', '--no-playlist', '--no-warnings', '--skip-download', url]

  // Primary: Executing resolved yt-dlp binary
  try {
    const { stdout, stderr } = await execFileAsync(binaryPath, args, {
      timeout: 15000,
      maxBuffer: 10 * 1024 * 1024
    })
    const execTime = Date.now() - startTime

    console.log('[YouTubeService:Diagnostic:Success]', {
      command: `${binaryPath} ${args.join(' ')}`,
      resolvedPath: binaryPath,
      execTimeMs: execTime,
      platform: process.platform,
      envPath: process.env.PATH,
      exitCode: 0,
      stdoutSnippet: stdout ? stdout.substring(0, 200) + '...' : '',
      stderr: stderr || null
    })

    const json = JSON.parse(stdout)
    const duration = Math.round(Number(json.duration) || 0)
    const title = json.title || 'YouTube Video'
    const thumbnail = json.thumbnail || (json.thumbnails && json.thumbnails.length > 0 ? json.thumbnails[json.thumbnails.length - 1].url : null)

    return { title, duration, thumbnail }
  } catch (err) {
    const execTime = Date.now() - startTime
    const stdoutStr = String(err.stdout || '')
    const stderrStr = String(err.stderr || err.message || '')

    console.warn('[YouTubeService:Diagnostic:YtDlpError]', {
      command: `${binaryPath} ${args.join(' ')}`,
      resolvedPath: binaryPath,
      execTimeMs: execTime,
      platform: process.platform,
      envPath: process.env.PATH,
      exitCode: err.code || null,
      stdout: stdoutStr.substring(0, 300),
      stderr: stderrStr.substring(0, 300),
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

    // Fallback 1: Python module execution
    try {
      const pyStartTime = Date.now()
      const pyCmd = IS_WIN ? 'python' : 'python3'
      const pyArgs = ['-m', 'yt_dlp', '--dump-single-json', '--no-playlist', '--no-warnings', '--skip-download', url]
      const { stdout: pyStdout, stderr: pyStderr } = await execFileAsync(pyCmd, pyArgs, {
        timeout: 15000,
        maxBuffer: 10 * 1024 * 1024
      })

      console.log('[YouTubeService:Diagnostic:PythonSuccess]', {
        command: `${pyCmd} ${pyArgs.join(' ')}`,
        execTimeMs: Date.now() - pyStartTime,
        stderr: pyStderr || null
      })

      const json = JSON.parse(pyStdout)
      const duration = Math.round(Number(json.duration) || 0)
      const title = json.title || 'YouTube Video'
      const thumbnail = json.thumbnail || (json.thumbnails && json.thumbnails.length > 0 ? json.thumbnails[json.thumbnails.length - 1].url : null)

      return { title, duration, thumbnail }
    } catch (pyErr) {
      console.warn('[YouTubeService:Diagnostic:PythonError]', {
        errorMessage: pyErr.message,
        stderr: String(pyErr.stderr || pyErr.message || '').substring(0, 300)
      })
    }

    // Fallback 2: Direct Web Scraper (Zero Binary Dependency)
    try {
      const scrapeStartTime = Date.now()
      const scrapedMeta = await fetchDirectYoutubeMeta(url)
      if (scrapedMeta && scrapedMeta.duration > 0) {
        console.log('[YouTubeService:Diagnostic:ScrapeSuccess]', {
          execTimeMs: Date.now() - scrapeStartTime,
          title: scrapedMeta.title,
          duration: scrapedMeta.duration
        })
        return scrapedMeta
      }
    } catch (scrapeErr) {
      console.warn('[YouTubeService:Diagnostic:ScrapeError]', scrapeErr.message)
    }

    // Fallback 3: oEmbed API
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json()
        return {
          title: oembedData.title || 'YouTube Video',
          duration: 0,
          thumbnail: oembedData.thumbnail_url || null,
          warning: 'yt-dlp binary unavailable, used oEmbed fallback.'
        }
      }
    } catch {
      // oembed failed
    }

    throw new Error('Could not fetch YouTube video metadata. Please verify the URL is a valid public YouTube video.')
  }
}
