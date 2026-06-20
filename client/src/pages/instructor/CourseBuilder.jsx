import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Cropper from 'react-easy-crop'
import {
  Plus, Trash2, GripVertical, ChevronDown, Upload, X, Check,
  PlayCircle, ZoomIn, ZoomOut, Crop, Eye, Pencil, FileText, Loader2
} from 'lucide-react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import TagInput from '../../components/ui/TagInput.jsx'
import Select from '../../components/ui/Select.jsx'
import { coursesAPI } from '../../api/courses.js'
import { adminAPI } from '../../api/admin.js'
import api from '../../api/axios.js'
import { CATEGORIES, LEVELS, LANGUAGES } from '../../utils/constants.js'
import toast from 'react-hot-toast'

const STEPS = ['Basic Info', 'Description & Media', 'Curriculum', 'Pricing & Publish']

const step1Schema = z.object({
  title:    z.string().min(5, 'Title must be at least 5 characters'),
  subtitle: z.string().optional().default(''),
  category: z.string().min(1, 'Select a category'),
  level:    z.string().min(1, 'Select a level'),
  language: z.string().default('English'),
  price:    z.union([z.string(), z.number()]).optional().default(''),
})

function isYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch|youtu\.be\/)/.test(url)
}

function getYouTubeThumbnail(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

// Returns a base64 JPEG data URL — stored directly in MongoDB, no CDN needed
async function getCroppedDataUrl(imageSrc, croppedAreaPixels) {
  const img = await new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width  = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height)
  // Scale down to max 800px wide to keep MongoDB doc small
  const MAX_W = 800
  if (canvas.width > MAX_W) {
    const scale = MAX_W / canvas.width
    const small = document.createElement('canvas')
    small.width  = MAX_W
    small.height = Math.round(canvas.height * scale)
    small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height)
    return small.toDataURL('image/jpeg', 0.80)
  }
  return canvas.toDataURL('image/jpeg', 0.80)
}

export default function CourseBuilder() {
  const navigate = useNavigate()
  const { id, instructorId } = useParams()
  const isAdminMode = !!instructorId
  const isEdit      = !!id

  const [step,         setStep]        = useState(0)
  const [tags,         setTags]        = useState([])
  const [description,  setDescription] = useState('')
  const [whatLearn,    setWhatLearn]   = useState([''])
  const [requirements, setReqs]        = useState([''])
  const [sections,     setSections]    = useState([])

  // Thumbnail + crop
  const [rawImgSrc,     setRawImgSrc]    = useState('')
  const [cropMode,      setCropMode]     = useState(false)
  const [crop,          setCrop]         = useState({ x: 0, y: 0 })
  const [zoom,          setZoom]         = useState(1)
  const [croppedArea,   setCroppedArea]  = useState(null)
  const [thumbDataUrl,  setThumbDataUrl] = useState('')  // base64, stored in MongoDB

  const [isFree,    setIsFree]   = useState(false)
  const [uploading, setUploading]= useState(false)
  const [courseId,  setCourseId] = useState(id || null)
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    type: '',
    sectionIndex: null,
    lessonIndex: null,
    title: '',
  })

  const { register, handleSubmit, formState: { errors }, getValues, watch, reset, setValue } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { language: 'English', price: '' },
  })

  useEffect(() => {
    if (isEdit && id) {
      const fetchCourseDetails = async () => {
        try {
          const res = await coursesAPI.getBySlug(id)
          const course = res.data?.data
          if (course) {
            reset({
              title: course.title || '',
              subtitle: course.subtitle || '',
              category: course.category || '',
              level: course.level || '',
              language: course.language || 'English',
              price: course.price !== undefined ? course.price : '',
            })
            setTags(course.tags || [])
            setDescription(course.description || '')
            setWhatLearn(course.whatYouLearn && course.whatYouLearn.length > 0 ? course.whatYouLearn : [''])
            setReqs(course.requirements && course.requirements.length > 0 ? course.requirements : [''])
            setIsFree(!!course.isFree)
            setThumbDataUrl(course.thumbnail || '')
            
            // Map curriculum sections and lessons
            const mappedSections = (course.curriculum || []).map((sec, secIdx) => {
              const secId = sec._id || sec.id || `sec-${Date.now()}-${secIdx}`
              return {
                id: secId,
                title: sec.title || '',
                lessons: (sec.lessons || []).map((les, lesIdx) => {
                  const lesId = les._id || les.id || `les-${Date.now()}-${secIdx}-${lesIdx}`
                  return {
                    id: lesId,
                    title: les.title || '',
                    videoUrl: les.videoUrl || '',
                    publicId: les.publicId || '',
                    duration: les.duration || 0,
                    isFree: !!les.isFree,
                    resources: les.resources || [],
                  }
                })
              }
            })
            setSections(mappedSections)
          }
        } catch (err) {
          console.error('Failed to fetch course details:', err)
          toast.error('Could not load course details')
        }
      }
      fetchCourseDetails()
    }
  }, [isEdit, id, reset])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Thumbnail handlers ──
  const handleThumbFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setRawImgSrc(reader.result); setCropMode(true); setZoom(1); setCrop({ x: 0, y: 0 }) }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_, areaPixels) => { setCroppedArea(areaPixels) }, [])

  const applyCrop = async () => {
    try {
      const dataUrl = await getCroppedDataUrl(rawImgSrc, croppedArea)
      setThumbDataUrl(dataUrl)
      setCropMode(false)
      toast.success('Thumbnail cropped!')
    } catch { toast.error('Crop failed') }
  }

  const cancelCrop = () => { setCropMode(false); if (!thumbDataUrl) setRawImgSrc('') }

  // ── Curriculum helpers ──
  const addSection    = () => setSections(s => [...s, { id: Date.now().toString(), title: 'New Section', lessons: [] }])
  const removeSection = (idx) => {
    const section = sections[idx]
    setConfirmDelete({
      isOpen: true,
      type: 'section',
      sectionIndex: idx,
      lessonIndex: null,
      title: section?.title || 'Section',
    })
  }
  const updateSection = (idx, key, val) => setSections(s => s.map((sec, i) => i === idx ? { ...sec, [key]: val } : sec))

  const addLesson = (si) => setSections(s => s.map((sec, i) => i === si
    ? { ...sec, lessons: [...sec.lessons, { id: Date.now().toString(), title: 'New Lesson', videoUrl: '', publicId: '', duration: 0, isFree: false, resources: [] }] }
    : sec
  ))
  const removeLesson = (si, li) => {
    const lesson = sections[si]?.lessons[li]
    setConfirmDelete({
      isOpen: true,
      type: 'lesson',
      sectionIndex: si,
      lessonIndex: li,
      title: lesson?.title || 'Lesson',
    })
  }
  const updateLesson = (si, li, key, val) => setSections(s => s.map((sec, i) => i === si
    ? { ...sec, lessons: sec.lessons.map((l, j) => j === li ? { ...l, [key]: val } : l) }
    : sec
  ))

  const handleConfirmDelete = () => {
    const { type, sectionIndex, lessonIndex } = confirmDelete
    if (type === 'section') {
      setSections(s => s.filter((_, i) => i !== sectionIndex))
      toast.success('Section deleted successfully')
    } else if (type === 'lesson') {
      setSections(s => s.map((sec, i) => i === sectionIndex ? { ...sec, lessons: sec.lessons.filter((_, j) => j !== lessonIndex) } : sec))
      toast.success('Lesson deleted successfully')
    }
    setConfirmDelete({ isOpen: false, type: '', sectionIndex: null, lessonIndex: null, title: '' })
  }

  const onSectionDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setSections(items => {
        const oi = items.findIndex(i => i.id === active.id)
        const ni = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oi, ni)
      })
    }
  }

  // ── Save / Publish ──
  const onPublish = async (status) => {
    // Read all registered fields explicitly — avoids stale/undefined values
    const title    = (getValues('title')    || '').trim()
    const subtitle = (getValues('subtitle') || '').trim()
    const category = (getValues('category') || '').trim()
    const level    = (getValues('level')    || '').trim()
    const language = (getValues('language') || 'English').trim()
    const rawPrice = getValues('price')

    if (!title || !category || !level) {
      toast.error('Please complete Step 1 — title, category and level are required')
      setStep(0)
      return
    }

    const price = isFree ? 0 : Math.max(0, parseFloat(rawPrice) || 0)

    setUploading(true)
    try {
      const payload = {
        title,
        subtitle,
        category,
        level,
        language,
        description:   description || '',
        tags,
        price,
        isFree,
        whatYouLearn:  whatLearn.filter(s => s.trim()),
        requirements:  requirements.filter(s => s.trim()),
        curriculum:    sections.map(({ id: _sid, ...sec }) => ({
          title:   sec.title,
          lessons: sec.lessons.map(({ id: _lid, _uploading, _videoMode, ...l }) => l),
        })),
        thumbnail: thumbDataUrl || undefined,
        status,
      }

      if (isAdminMode) {
        if (isEdit && courseId) {
          await adminAPI.updateAnyCourse(courseId, payload)
          toast.success('Course updated!')
        } else {
          const { data } = await adminAPI.createCourseForInstructor(instructorId, payload)
          setCourseId(data.data._id)
          toast.success(status === 'published' ? 'Course published!' : 'Saved as draft')
        }
        navigate(`/admin/instructors/${instructorId}`)
      } else {
        if (isEdit && courseId) {
          await coursesAPI.update(courseId, payload)
          toast.success('Course updated!')
        } else {
          const { data } = await coursesAPI.create(payload)
          setCourseId(data.data._id)
          toast.success(status === 'published' ? 'Course published!' : 'Saved as draft')
        }
        navigate('/instructor/courses')
      }
    } catch (err) {
      console.error('Course save error:', err.response?.data || err.message)
      toast.error(err.response?.data?.message || err.message || 'Could not save course')
    } finally {
      setUploading(false)
    }
  }

  // ── Step form values for preview ──
  const watchTitle    = watch('title')    || 'Course Title'
  const watchCategory = watch('category') || 'Category'
  const watchLevel    = watch('level')    || 'Level'

  return (
    <PageLayout>
      {/* Crop modal */}
      {cropMode && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.92)' }}>
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2"><Crop size={18} /> Crop Thumbnail</h2>
            <button onClick={cancelCrop} className="text-white/60 hover:text-white"><X size={22} /></button>
          </div>
          <div className="relative flex-1">
            <Cropper
              image={rawImgSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <ZoomOut size={16} color="white" />
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))}
                className="w-36 accent-purple-500" />
              <ZoomIn size={16} color="white" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={cancelCrop} style={{ color: 'white', borderColor: 'white' }}>Cancel</Button>
              <Button onClick={applyCrop}>Apply Crop</Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl border flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-500 shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Delete {confirmDelete.type === 'section' ? 'Section' : 'Lesson'}?</h3>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>This action cannot be undone.</p>
              </div>
            </div>

            <div className="py-2.5 px-4 rounded-xl border text-sm" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}>
              <span className="font-bold text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Name</span>
              <span className="font-semibold truncate block" style={{ color: 'var(--text-primary)' }}>{confirmDelete.title}</span>
            </div>

            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this {confirmDelete.type}?
            </p>

            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete({ isOpen: false, type: '', sectionIndex: null, lessonIndex: null, title: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          {isEdit ? 'Edit Course' : 'Create New Course'}
        </h1>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => i < step && setStep(i)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shrink-0"
                style={{
                  background: i === step ? '#7C3AED' : i < step ? '#EDE9FE' : 'transparent',
                  color:      i === step ? 'white'   : i < step ? '#7C3AED' : 'var(--text-muted)',
                  cursor:     i < step ? 'pointer' : 'default',
                }}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: i === step ? 'rgba(255,255,255,0.3)' : i < step ? '#7C3AED' : 'var(--border-default)', color: i < step ? 'white' : 'inherit' }}>
                  {i < step ? <Check size={10} /> : i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <div className="w-6 h-0.5 shrink-0" style={{ background: i < step ? '#7C3AED' : 'var(--border-default)' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 0 && (
          <form onSubmit={handleSubmit(() => setStep(1))} className="max-w-2xl space-y-5">
            <Input label="Course Title" placeholder="e.g. Complete React Developer" error={errors.title?.message} required {...register('title')} />
            <Input label="Subtitle" placeholder="Short tagline for your course" {...register('subtitle')} />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                required
                placeholder="Select category"
                value={watch('category') || ''}
                onChange={v => setValue('category', v, { shouldValidate: true })}
                options={CATEGORIES}
                error={errors.category?.message}
              />
              <Select
                label="Level"
                required
                placeholder="Select level"
                value={watch('level') || ''}
                onChange={v => setValue('level', v, { shouldValidate: true })}
                options={LEVELS}
                error={errors.level?.message}
              />
            </div>
            <Select
              label="Language"
              value={watch('language') || 'English'}
              onChange={v => setValue('language', v)}
              options={LANGUAGES}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tags</label>
              <TagInput value={tags} onChange={setTags} placeholder="e.g. react, hooks, javascript" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Next →</Button>
            </div>
          </form>
        )}

        {/* ── STEP 2: Description & Media ── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left — form */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>Course Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={4} placeholder="Describe what students will gain..." className="input-field w-full resize-none" />
              </div>

              {/* Thumbnail upload + crop */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                  Course Thumbnail <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(16:9 recommended)</span>
                </label>
                {thumbDataUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img src={thumbDataUrl} className="w-full h-full object-cover" alt="thumbnail" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setCropMode(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                          style={{ background: '#7C3AED' }}>
                          <Crop size={14} /> Re-crop
                        </button>
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.2)' }}>
                          <Upload size={14} /> Change
                          <input type="file" accept="image/*" className="hidden" onChange={handleThumbFile} />
                        </label>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: '#059669' }}>✓ Thumbnail ready</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer border-2 border-dashed transition-colors hover:border-[#7C3AED]"
                    style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}>
                    <Upload size={22} color="#7C3AED" />
                    <span className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Click to upload</span>
                    <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>PNG, JPG · max 5 MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbFile} />
                  </label>
                )}
              </div>

              {/* What you'll learn */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>What students will learn</label>
                <div className="space-y-2">
                  {whatLearn.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={item} onChange={e => setWhatLearn(a => a.map((x, j) => j === i ? e.target.value : x))}
                        placeholder={`Learning point ${i + 1}`} className="input-field flex-1" />
                      {whatLearn.length > 1 && (
                        <button onClick={() => setWhatLearn(a => a.filter((_, j) => j !== i))} className="p-2 rounded-lg transition-colors"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <X size={14} color="#EF4444" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setWhatLearn(a => [...a, ''])} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#7C3AED' }}>
                    <Plus size={14} /> Add point
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>Requirements</label>
                <div className="space-y-2">
                  {requirements.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={item} onChange={e => setReqs(a => a.map((x, j) => j === i ? e.target.value : x))}
                        placeholder={`Requirement ${i + 1}`} className="input-field flex-1" />
                      {requirements.length > 1 && (
                        <button onClick={() => setReqs(a => a.filter((_, j) => j !== i))} className="p-2 rounded-lg transition-colors"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <X size={14} color="#EF4444" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setReqs(a => [...a, ''])} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#7C3AED' }}>
                    <Plus size={14} /> Add requirement
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={() => setStep(2)}>Next →</Button>
              </div>
            </div>

            {/* Right — live course card preview */}
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Eye size={13} /> Card Preview
              </p>
              <div className="rounded-2xl overflow-hidden shadow-card-hover" style={{ border: '1px solid var(--border-purple)' }}>
                {/* Thumbnail area */}
                <div className="relative" style={{ aspectRatio: '16/9', background: thumbDataUrl ? 'transparent' : 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' }}>
                  {thumbDataUrl ? (
                    <img src={thumbDataUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">🎓</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: '#7C3AED', color: 'white' }}>
                    {watchLevel || 'Beginner'}
                  </div>
                </div>
                {/* Card body */}
                <div className="p-4" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#7C3AED' }}>{watchCategory || 'Category'}</p>
                  <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    {watchTitle || 'Your Course Title'}
                  </h3>
                  {description && (
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>{description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-xs">★</span>)}
                      <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>New</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: '#7C3AED' }}>
                      {isFree ? 'Free' : '₹—'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>This is how your course card will appear to students</p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Curriculum ── */}
        {step === 2 && (
          <div className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map((section, si) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    si={si}
                    onUpdateSection={updateSection}
                    onRemoveSection={removeSection}
                    onAddLesson={addLesson}
                    onRemoveLesson={removeLesson}
                    onUpdateLesson={updateLesson}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button onClick={addSection}
              className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED]"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
              <Plus size={16} /> Add Section
            </button>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)}>Next →</Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Pricing & Publish ── */}
        {step === 3 && (
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
              <label className="flex items-center gap-3 cursor-pointer mb-5">
                <div onClick={() => setIsFree(f => !f)}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ background: isFree ? '#7C3AED' : '#D1D5DB' }}>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: isFree ? 'translateX(20px)' : 'none' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Make this course free</span>
              </label>

              {!isFree && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="499"
                      className="input-field w-full"
                      style={{ paddingLeft: '2rem' }}
                      onKeyDown={e => ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault()}
                      {...register('price', {
                        setValueAs: v => Math.max(0, parseInt(v) || 0)
                      })}
                    />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Minimum ₹0 · Recommended: ₹299, ₹499, ₹799, ₹999</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button variant="outline" onClick={() => onPublish('draft')} loading={uploading} className="flex-1">
                Save as Draft
              </Button>
              <Button onClick={() => onPublish('published')} loading={uploading} className="flex-1">
                Publish Course
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

// ── Sortable Section ──
function SortableSection({ section, si, onUpdateSection, onRemoveSection, onAddLesson, onRemoveLesson, onUpdateLesson }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [open,    setOpen]    = useState(true)
  const [editing, setEditing] = useState(false)
  const inputRef = React.useRef(null)

  const startEdit = () => {
    setEditing(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }

  return (
    <div ref={setNodeRef}
      style={{ ...style, border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}
      className="rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-muted)', borderBottom: open ? '1px solid var(--border-default)' : 'none' }}>
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical size={16} color="var(--text-muted)" />
        </span>

        {/* Editable title */}
        {editing ? (
          <input
            ref={inputRef}
            value={section.title}
            onChange={e => onUpdateSection(si, 'title', e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key === 'Enter' && setEditing(false)}
            className="flex-1 rounded-lg px-2 py-1 text-sm font-semibold outline-none"
            style={{ background: 'var(--bg-surface)', border: '1.5px solid #7C3AED', color: 'var(--text-primary)' }}
          />
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {section.title || 'New Section'}
            </span>
            <button
              onClick={startEdit}
              className="shrink-0 p-1 rounded-md transition-colors"
              title="Rename section"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Pencil size={13} color="#7C3AED" />
            </button>
          </div>
        )}

        <button onClick={() => setOpen(o => !o)} className="shrink-0 p-1 rounded-md transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ChevronDown size={16} color="var(--text-secondary)" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={() => onRemoveSection(si)} className="shrink-0 p-1 rounded-md transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Trash2 size={14} color="#EF4444" />
        </button>
      </div>

      {open && (
        <div className="p-3 space-y-2" style={{ background: 'var(--bg-surface)' }}>
          {section.lessons.map((lesson, li) => (
            <LessonRow key={lesson.id || li} lesson={lesson} si={si} li={li}
              onUpdateLesson={onUpdateLesson} onRemoveLesson={onRemoveLesson} />
          ))}
          <button onClick={() => onAddLesson(si)}
            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
            style={{ color: '#7C3AED', border: '1px dashed var(--border-purple)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Plus size={14} /> Add Lesson
          </button>
        </div>
      )}
    </div>
  )
}

// ── Lesson Row — YouTube only (no Cloudinary) ──
function LessonRow({ lesson, si, li, onUpdateLesson, onRemoveLesson }) {
  const [ytInput, setYtInput] = useState(lesson.videoUrl || '')
  const [durationInput, setDurationInput] = useState(lesson.duration ? Math.round(lesson.duration / 60) : '')
  const [uploadingNotes, setUploadingNotes] = useState(false)

  const handleNotesUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploadingNotes(true)
    toast.loading('Uploading notes...', { id: `upload-${si}-${li}` })

    try {
      const { data } = await api.post('/upload/resource', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      onUpdateLesson(si, li, 'resources', [{ name: file.name, url: data.url, type: 'pdf' }])
      toast.success('Notes uploaded successfully!', { id: `upload-${si}-${li}` })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload notes', { id: `upload-${si}-${li}` })
    } finally {
      setUploadingNotes(false)
    }
  }

  const handleYtInput = async (val) => {
    setYtInput(val)
    const url = val.trim()
    if (!url) return
    if (isYouTubeUrl(url) && url !== lesson.videoUrl) {
      try {
        toast.loading('Fetching YouTube metadata...', { id: `yt-meta-${si}-${li}` })
        const { data } = await coursesAPI.getYoutubeMeta(url)
        
        // 1. Update Title (if the current title is empty or "New Lesson")
        if (!lesson.title || lesson.title.trim() === '' || lesson.title.trim() === 'New Lesson') {
          onUpdateLesson(si, li, 'title', data.data.title)
        }
        
        // 2. Update Duration
        const mins = Math.round(data.data.duration / 60)
        setDurationInput(mins > 0 ? mins.toString() : '0')
        onUpdateLesson(si, li, 'duration', data.data.duration)
        
        // 3. Update videoUrl
        onUpdateLesson(si, li, 'videoUrl', url)
        
        toast.success('YouTube metadata loaded automatically!', { id: `yt-meta-${si}-${li}` })
      } catch (err) {
        toast.error('Could not fetch YouTube metadata automatically.', { id: `yt-meta-${si}-${li}` })
      }
    }
  }

  const applyYt = () => {
    const url = ytInput.trim()
    if (!url) return
    if (!isYouTubeUrl(url)) {
      toast.error('Enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)')
      return
    }
    const mins = parseInt(durationInput) || 0
    onUpdateLesson(si, li, 'videoUrl', url)
    onUpdateLesson(si, li, 'duration', mins * 60)
    toast.success('YouTube link and duration saved!')
  }

  const clearYt = () => {
    setYtInput('')
    setDurationInput('')
    onUpdateLesson(si, li, 'videoUrl', '')
    onUpdateLesson(si, li, 'duration', 0)
  }

  const savedYt  = lesson.videoUrl && isYouTubeUrl(lesson.videoUrl)
  const ytThumb  = savedYt ? getYouTubeThumbnail(lesson.videoUrl) : null

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
      {/* Title row */}
      <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <GripVertical size={14} color="var(--text-muted)" className="shrink-0" />
        <input value={lesson.title} onChange={e => onUpdateLesson(si, li, 'title', e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text-primary)' }}
          placeholder="Lesson title" />
        <label className="flex items-center gap-1.5 text-xs cursor-pointer shrink-0" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={lesson.isFree} onChange={e => onUpdateLesson(si, li, 'isFree', e.target.checked)}
            style={{ accentColor: '#7C3AED' }} />
          Free preview
        </label>
        <button onClick={() => onRemoveLesson(si, li)} className="p-1 rounded shrink-0 transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Trash2 size={13} color="#EF4444" />
        </button>
      </div>

      {/* YouTube input + preview */}
      <div className="flex gap-0">
        {/* Left: input */}
        <div className="flex-1 p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <PlayCircle size={13} color="#FF0000" />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>YouTube Video</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-muted)' }}>
              <input value={ytInput} onChange={e => handleYtInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyYt()}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 bg-transparent outline-none text-xs" style={{ color: 'var(--text-primary)' }} />
              {ytInput && (
                <button onClick={clearYt} className="shrink-0">
                  <X size={12} color="var(--text-muted)" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg shrink-0"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-muted)', width: '85px' }}>
              <input
                type="number"
                min="0"
                placeholder="Mins"
                value={durationInput}
                onChange={e => setDurationInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyYt()}
                className="w-full bg-transparent outline-none text-xs text-center font-medium"
                style={{ color: 'var(--text-primary)' }}
              />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>min</span>
            </div>

            <button onClick={applyYt}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
              style={{ background: '#FF0000', color: 'white' }}>
              Save
            </button>
          </div>
          {savedYt && (
            <p className="text-xs flex items-center gap-1" style={{ color: '#059669' }}>
              <Check size={11} /> YouTube link saved ({Math.round(lesson.duration / 60)} min)
            </p>
          )}
        </div>

        {/* Right: thumbnail preview & notes */}
        <div className="w-48 shrink-0 p-3 pl-0 flex flex-col gap-2">
          <div className="flex items-center">
            {savedYt && ytThumb ? (
              <div className="w-full rounded-lg overflow-hidden relative" style={{ aspectRatio: '16/9', background: '#0F0F0F' }}>
                <img src={ytThumb} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,0,0,0.85)' }}>
                    <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '8px solid white', marginLeft: 2 }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-lg flex flex-col items-center justify-center gap-1"
                style={{ aspectRatio: '16/9', background: 'var(--bg-muted)', border: '1px dashed var(--border-default)' }}>
                <PlayCircle size={16} color="var(--text-muted)" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No video</span>
              </div>
            )}
          </div>

          <div className="w-full">
             {lesson.resources && lesson.resources.length > 0 ? (
                 <div className="flex items-center justify-between bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] rounded-lg p-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                       <FileText size={14} color="#7C3AED" className="shrink-0" />
                       <span className="text-[10px] font-medium text-[#7C3AED] truncate">{lesson.resources[0].name}</span>
                    </div>
                    <button onClick={() => onUpdateLesson(si, li, 'resources', [])} className="shrink-0 ml-1">
                       <X size={12} color="#EF4444" />
                    </button>
                 </div>
             ) : (
                 <label className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg border border-dashed cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                 >
                    {uploadingNotes ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    <span className="text-[11px] font-medium">{uploadingNotes ? 'Uploading...' : 'Add Notes (PDF)'}</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleNotesUpload} disabled={uploadingNotes} />
                 </label>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
