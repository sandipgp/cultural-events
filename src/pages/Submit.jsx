import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, PHOTO_BUCKET } from '../supabaseClient.js'
import { FLAT_LIST } from '../lib/flats.js'
import { detectAiPhoto, AI_CHECK_ENABLED } from '../lib/aiDetect.js'
import { formatDateLabel } from '../lib/deadline.js'
import { useContestOver, useLastDate } from '../lib/settings.js'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'

const STATUS = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  SUBMITTING: 'submitting',
  DONE: 'done',
}

const MAX_MB = 10
const MAX_BYTES = MAX_MB * 1024 * 1024
const MAX_DESC = 50

export default function Submit() {
  const { over: contestOver } = useContestOver()
  const { label: lastDate } = useLastDate()
  const [name, setName] = useState('')
  const [flat, setFlat] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [status, setStatus] = useState(STATUS.IDLE)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [aiResult, setAiResult] = useState(null) // result of the Gemini AI check
  const [replacing, setReplacing] = useState(false) // flat already has a photo
  const fileInputRef = useRef(null)

  function onPickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (f.size > MAX_BYTES) {
      setError(`Photo is too large. Maximum size is ${MAX_MB} MB.`)
      return
    }
    setError('')
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  function clearPhoto() {
    setFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Please enter your name.')
    if (!flat) return setError('Please select your flat number.')
    if (!file) return setError('Please upload one photo.')

    if (AI_CHECK_ENABLED) setStatus(STATUS.ANALYZING)

    // Is there already a submission for this flat? (We'll confirm replacement.)
    const { data: existing, error: checkErr } = await supabase
      .from('submissions')
      .select('id')
      .eq('flat_number', flat)
      .maybeSingle()

    if (checkErr) {
      setStatus(STATUS.IDLE)
      return setError(checkErr.message)
    }
    setReplacing(!!existing)

    // Run the best-effort AI check (never throws; may be "unavailable").
    const result = await detectAiPhoto(file)
    setAiResult(result)

    setStatus(STATUS.IDLE)
    setConfirmOpen(true) // show the AI result + confirmation before uploading
  }

  async function doUpload() {
    setConfirmOpen(false)
    setStatus(STATUS.SUBMITTING)
    setError('')

    try {
      // Deterministic path per flat => re-uploading overwrites the same object,
      // so a flat never ends up with more than one photo.
      const path = `flat-${flat}`

      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
      const now = new Date().toISOString()

      const { error: rowErr } = await supabase
        .from('submissions')
        .upsert(
          {
            name: name.trim(),
            flat_number: flat,
            photo_path: path,
            photo_url: pub.publicUrl,
            is_ai: aiResult?.isAI ?? false,
            description: description.trim() || null,
            updated_at: now,
          },
          { onConflict: 'flat_number' }
        )
      if (rowErr) throw rowErr

      setStatus(STATUS.DONE)
    } catch (err) {
      setStatus(STATUS.IDLE)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  function resetForm() {
    setName('')
    setFlat('')
    clearPhoto()
    setStatus(STATUS.IDLE)
    setError('')
    setAiResult(null)
    setReplacing(false)
    setDescription('')
  }

  if (contestOver) {
    return (
      <div className="screen">
        <AppHeader />
        <div className="card thanks">
          <div className="thanks-mark">🏆</div>
          <h2>Submissions are closed</h2>
          <p>
            The contest closed after <strong>{formatDateLabel(lastDate)}</strong>.
            Thank you to everyone who took part!
          </p>
          <Link className="btn" to="/winners">
            See the winners 🎉
          </Link>
          <Link className="btn ghost" to="/gallery">
            View all photos
          </Link>
        </div>
        <AppFooter />
      </div>
    )
  }

  if (status === STATUS.DONE) {
    return (
      <div className="screen">
        <AppHeader />
        <div className="card thanks">
          <div className="thanks-mark">🙏</div>
          <h2>Thank you!</h2>
          <p>
            Your photo for flat <strong>{flat}</strong> has been submitted
            for the Ganpati photo contest.
          </p>
          <p className="muted">Ganpati Bappa Morya! 🌺</p>
          <button className="btn" onClick={resetForm}>
            Submit another flat
          </button>
          <Link className="btn ghost" to="/gallery">
            View the gallery
          </Link>
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="screen">
      <AppHeader />

      <div className="intro card">
        <GaneshImage />
        <h2>Ganpati Decoration Photo Contest</h2>
        <ul className="rules">
          <li>Only <strong>1 photo</strong> allowed per flat</li>
          <li><strong>No AI filters</strong> — such photos will be rejected from the contest</li>
          <li>Maximum photo size <strong>{MAX_MB} MB</strong></li>
          {lastDate && (
            <li>Last date to submit: <strong>{formatDateLabel(lastDate)}</strong></li>
          )}
        </ul>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="row-2">
          <label className="field">
            <span>Your name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Tanishq Patil"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Flat number</span>
            <select value={flat} onChange={(e) => setFlat(e.target.value)}>
              <option value="">Select…</option>
              {FLAT_LIST.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <span>Photo (only one)</span>
          {previewUrl ? (
            <div className="preview">
              <img src={previewUrl} alt="Selected preview" />
              <button type="button" className="btn ghost small" onClick={clearPhoto}>
                Change photo
              </button>
            </div>
          ) : (
            <label className="upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
              />
              <span className="upload-inner">
                <span className="upload-icon">📷</span>
                Tap to upload a photo
              </span>
            </label>
          )}
        </div>

        <label className="field">
          <span>Description (optional)</span>
          <textarea
            rows={2}
            maxLength={MAX_DESC}
            value={description}
            placeholder="A short note about your decoration…"
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
          />
          <span className="char-count">
            {description.length}/{MAX_DESC}
          </span>
        </label>

        {error && <p className="error">{error}</p>}

        <button
          className="btn"
          type="submit"
          disabled={status === STATUS.ANALYZING || status === STATUS.SUBMITTING}
        >
          {status === STATUS.ANALYZING
            ? 'Checking photo…'
            : status === STATUS.SUBMITTING
            ? 'Uploading…'
            : 'Submit photo'}
        </button>

        <Link className="link-gallery" to="/gallery">
          View submitted photos →
        </Link>
      </form>

      <AppFooter />

      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {aiResult?.available && aiResult.isGanpati === false ? (
              // Not a Ganpati photo -> reject; no way to confirm.
              <>
                <h3>Photo not accepted</h3>
                <div className="ai-note warn">
                  <strong>🚫 This doesn't look like a Ganpati photo.</strong>{' '}
                  Only photos of your Ganpati idol or decoration are allowed
                  {aiResult.reason ? ` (${aiResult.reason})` : ''}. Please
                  choose a different photo.
                </div>
                <div className="modal-actions">
                  <button className="btn" onClick={() => setConfirmOpen(false)}>
                    Choose another photo
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Confirm your photo</h3>

                {/* AI check result */}
                {aiResult?.available && aiResult.isAI && (
                  <div className="ai-note warn">
                    <strong>⚠️ AI content detected.</strong> This photo looks
                    AI-generated or heavily AI-filtered
                    {aiResult.reason ? ` (${aiResult.reason})` : ''}. It will be
                    shown with an <strong>“AI”</strong> label in the gallery.
                  </div>
                )}
                {aiResult?.available && !aiResult.isAI && (
                  <div className="ai-note ok">
                    <strong>✅ Looks good.</strong> Ganpati photo confirmed, no
                    AI filters detected.
                  </div>
                )}
                {aiResult && !aiResult.available && !aiResult.skipped && (
                  <div className="ai-note info">
                    <strong>ℹ️ AI check unavailable.</strong> We couldn't run
                    the automatic check right now. Please make sure this is a
                    genuine Ganpati photo with no AI filters before submitting.
                  </div>
                )}

                {/* Replacement warning, if applicable */}
                {replacing && (
                  <p className="modal-sub">
                    Flat <strong>{flat}</strong> already has a photo — submitting
                    will <strong>replace</strong> it.
                  </p>
                )}

                <p className="modal-sub muted">
                  By submitting, you confirm this is your own genuine Ganpati
                  decoration photo.
                </p>

                <div className="modal-actions">
                  <button className="btn ghost" onClick={() => setConfirmOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn" onClick={doUpload}>
                    {replacing ? 'Confirm & replace' : 'Confirm & submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Shows /public/ganesh.png if you add one; otherwise falls back to an emoji
// so the page never shows a broken image.
function GaneshImage() {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className=""></div>
  return (
    <img
      className="ganesh"
      src="/ganesh.png"
      alt="Lord Ganesha"
      onError={() => setFailed(true)}
    />
  )
}
