import LegalPage from '../models/LegalPage.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError }    from '../utils/ApiError.js'

const ALL_KEYS = [
  'privacy-policy',
  'terms-and-conditions',
  'cookie-policy',
  'refund-policy',
  'disclaimer',
  'acceptable-use',
  'community-guidelines',
  'grievance',
  'copyright',
]

/**
 * Called once on server startup.
 * Creates a document for each legal page key if it doesn't already exist.
 * Uses $setOnInsert so existing records are never overwritten.
 */
export async function seedLegalPages() {
  try {
    await Promise.all(
      ALL_KEYS.map((key) =>
        LegalPage.findOneAndUpdate(
          { pageKey: key },
          { $setOnInsert: { pageKey: key, isEnabled: true, customContent: [] } },
          { upsert: true, new: true }
        )
      )
    )
    console.log('✅ Legal pages feature flags seeded')
  } catch (err) {
    console.error('❌ Failed to seed legal pages:', err.message)
  }
}

/**
 * GET /api/legal
 * Public. Returns all 9 legal pages with their isEnabled flag.
 * customContent is excluded — only needed by the editor in Phase 2.
 */
export async function getAllLegalPages(req, res, next) {
  try {
    const pages = await LegalPage.find()
      .select('pageKey isEnabled lastToggledAt')
      .lean()
    res.json(new ApiResponse(200, pages))
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/legal/:key
 * Public. Returns a single legal page's settings.
 * If no document found yet (before seed), defaults to enabled.
 */
export async function getLegalPage(req, res, next) {
  try {
    const { key } = req.params
    const page = await LegalPage.findOne({ pageKey: key })
      .select('pageKey isEnabled lastToggledAt')
      .lean()

    // Not found = not yet seeded = treat as enabled (safe default)
    if (!page) {
      return res.json(new ApiResponse(200, { pageKey: key, isEnabled: true }))
    }
    res.json(new ApiResponse(200, page))
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/legal/:key/toggle
 * Admin only. Flips the isEnabled flag for the given page key.
 */
export async function toggleLegalPage(req, res, next) {
  try {
    const { key } = req.params

    if (!ALL_KEYS.includes(key)) {
      throw new ApiError(404, `Unknown legal page key: "${key}"`)
    }

    const page = await LegalPage.findOne({ pageKey: key })
    if (!page) throw new ApiError(404, 'Legal page record not found. Run server restart to re-seed.')

    page.isEnabled      = !page.isEnabled
    page.lastToggledBy  = req.user._id
    page.lastToggledAt  = new Date()
    await page.save()

    res.json(new ApiResponse(
      200,
      { pageKey: page.pageKey, isEnabled: page.isEnabled, lastToggledAt: page.lastToggledAt },
      `"${key}" has been ${page.isEnabled ? 'enabled' : 'disabled'}`
    ))
  } catch (err) {
    next(err)
  }
}
