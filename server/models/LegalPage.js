import mongoose from 'mongoose'

/**
 * LegalPage — feature flag + future content overrides for each legal page.
 *
 * Phase 1: isEnabled toggle only.
 * Phase 2: customContent array for per-section HTML overrides (schema ready, unused now).
 * Phase 3: version history (add a versions array).
 */

// Phase 2 ready — subdoc schema for content overrides. Empty array in Phase 1.
const customContentSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },  // matches the `id` prop on <LegalSection>
  html:      { type: String, default: '' },      // DOMPurify-sanitised HTML override
}, { _id: false })

const legalPageSchema = new mongoose.Schema({
  pageKey: {
    type:     String,
    required: true,
    unique:   true,
    enum: [
      'privacy-policy',
      'terms-and-conditions',
      'cookie-policy',
      'refund-policy',
      'disclaimer',
      'acceptable-use',
      'community-guidelines',
      'grievance',
      'copyright',
    ],
  },

  isEnabled: { type: Boolean, default: true },

  // Phase 2: content overrides — empty array in Phase 1, schema already structured for later
  customContent: { type: [customContentSchema], default: [] },

  // Audit trail
  lastToggledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lastToggledAt: { type: Date, default: null },

}, { timestamps: true })

export default mongoose.model('LegalPage', legalPageSchema)
