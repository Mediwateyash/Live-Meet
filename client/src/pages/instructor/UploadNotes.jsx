import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Download, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  CheckCircle2, 
  Search,
  BookOpenCheck,
  FolderPlus,
  Edit2,
  Sparkles,
  Save,
  X,
  RefreshCw,
  Brain,
  Plus
} from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmModal from '../../components/ui/ConfirmModal.jsx'
import api from '../../api/axios.js'
import { coursesAPI } from '../../api/courses.js'
import toast from 'react-hot-toast'

export default function UploadNotes() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState({})
  const [uploadingLessonId, setUploadingLessonId] = useState(null)

  // WH Questions Modal state
  const [whModalState, setWhModalState] = useState({
    isOpen: false,
    step: 'setup', // 'setup', 'generating', 'edit'
    questions: [],
    sectionIndex: null,
    lessonIndex: null,
    resourceUrl: '',
    resourceName: '',
    numQuestions: 5,
  })

  // Creation states
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  
  const [addingLessonToSection, setAddingLessonToSection] = useState(null)
  const [newLessonTitle, setNewLessonTitle] = useState('')

  // Rename states
  const [editingSectionId, setEditingSectionId] = useState(null)
  const [editSectionTitle, setEditSectionTitle] = useState('')
  
  const [editingLessonId, setEditingLessonId] = useState(null)
  const [editLessonTitle, setEditLessonTitle] = useState('')

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const triggerConfirm = (title, message, onConfirmAction) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction()
        setConfirmState(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      const res = await coursesAPI.getBySlug(id)
      const courseData = res.data?.data
      if (courseData) {
        setCourse(courseData)
        // Expand all sections by default
        const initialExpanded = {}
        courseData.curriculum?.forEach((sec, idx) => {
          const secId = sec._id || `sec-${idx}`
          initialExpanded[secId] = true
        })
        setExpandedSections(initialExpanded)
      } else {
        toast.error('Course not found')
        navigate('/instructor/courses')
      }
    } catch (err) {
      toast.error('Failed to load course details')
      navigate('/instructor/courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCourseDetails()
    }
  }, [id])

  const toggleSection = (secId) => {
    setExpandedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }))
  }

  // ── Section Actions ──
  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) {
      toast.error('Section name cannot be empty')
      return
    }

    const toastId = toast.loading('Creating section...')
    try {
      const updatedCurriculum = [...(course.curriculum || [])]
      const newSec = {
        title: newSectionTitle.trim(),
        lessons: []
      }
      updatedCurriculum.push(newSec)

      const res = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
      const updatedCourse = res.data?.data || { ...course, curriculum: updatedCurriculum }
      setCourse(updatedCourse)
      
      // Expand the newly created section
      const lastSec = updatedCourse.curriculum[updatedCourse.curriculum.length - 1]
      const lastSecId = lastSec._id || `sec-${updatedCourse.curriculum.length - 1}`
      setExpandedSections(prev => ({ ...prev, [lastSecId]: true }))

      toast.success('Section created successfully!', { id: toastId })
      setNewSectionTitle('')
      setIsAddingSection(false)
    } catch (err) {
      toast.error('Failed to create section', { id: toastId })
    }
  }

  const handleRenameSection = async (sectionIndex, sectionId) => {
    if (!editSectionTitle.trim()) {
      toast.error('Section name cannot be empty')
      return
    }

    const toastId = toast.loading('Renaming section...')
    try {
      const updatedCurriculum = JSON.parse(JSON.stringify(course.curriculum))
      updatedCurriculum[sectionIndex].title = editSectionTitle.trim()

      const res = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
      setCourse(res.data?.data || { ...course, curriculum: updatedCurriculum })
      toast.success('Section renamed successfully!', { id: toastId })
      setEditingSectionId(null)
      setEditSectionTitle('')
    } catch (err) {
      toast.error('Failed to rename section', { id: toastId })
    }
  }

  const handleDeleteSection = (sectionIndex, sectionTitle) => {
    const section = course.curriculum[sectionIndex]
    const hasLessons = section.lessons && section.lessons.length > 0
    const msg = hasLessons 
      ? `Are you sure you want to delete "${sectionTitle}"? This will delete all ${section.lessons.length} lessons and their uploaded notes inside this section.`
      : `Are you sure you want to delete "${sectionTitle}"?`
      
    triggerConfirm(
      'Delete Section',
      msg,
      async () => {
        const toastId = toast.loading('Deleting section...')
        try {
          const updatedCurriculum = JSON.parse(JSON.stringify(course.curriculum))
          updatedCurriculum.splice(sectionIndex, 1)

          const res = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
          setCourse(res.data?.data || { ...course, curriculum: updatedCurriculum })
          toast.success('Section deleted successfully!', { id: toastId })
        } catch (err) {
          toast.error('Failed to delete section', { id: toastId })
        }
      }
    )
  }

  // ── Lesson / Note Row Actions ──
  const handleAddLesson = async (sectionIndex) => {
    if (!newLessonTitle.trim()) {
      toast.error('Topic name cannot be empty')
      return
    }

    const toastId = toast.loading('Creating note topic...')
    try {
      const updatedCurriculum = JSON.parse(JSON.stringify(course.curriculum))
      const targetSection = updatedCurriculum[sectionIndex]
      
      const newLes = {
        title: newLessonTitle.trim(),
        videoUrl: '',
        duration: 0,
        isFree: false,
        resources: []
      }
      targetSection.lessons = [...(targetSection.lessons || []), newLes]

      const res = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
      setCourse(res.data?.data || { ...course, curriculum: updatedCurriculum })
      toast.success('Topic created successfully!', { id: toastId })
      setNewLessonTitle('')
      setAddingLessonToSection(null)
    } catch (err) {
      toast.error('Failed to create topic', { id: toastId })
    }
  }

  const handleRenameLesson = async (sectionIndex, lessonIndex) => {
    if (!editLessonTitle.trim()) {
      toast.error('Topic name cannot be empty')
      return
    }

    const toastId = toast.loading('Renaming topic...')
    try {
      const updatedCurriculum = JSON.parse(JSON.stringify(course.curriculum))
      updatedCurriculum[sectionIndex].lessons[lessonIndex].title = editLessonTitle.trim()

      const res = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
      setCourse(res.data?.data || { ...course, curriculum: updatedCurriculum })
      toast.success('Topic renamed successfully!', { id: toastId })
      setEditingLessonId(null)
      setEditLessonTitle('')
    } catch (err) {
      toast.error('Failed to rename topic', { id: toastId })
    }
  }

  const handleDeleteLesson = (sectionIndex, lessonIndex, lessonTitle) => {
    const lesson = course.curriculum[sectionIndex].lessons[lessonIndex]
    const hasNotes = lesson.resources && lesson.resources.length > 0
    const msg = hasNotes 
      ? `Are you sure you want to delete "${lessonTitle}"? This will delete all uploaded files for this topic.`
      : `Are you sure you want to delete "${lessonTitle}"?`
      
    triggerConfirm(
      'Delete Topic',
      msg,
      async () => {
        const toastId = toast.loading('Deleting topic...')
        try {
          const updatedCurriculum = JSON.parse(JSON.stringify(course.curriculum))
          updatedCurriculum[sectionIndex].lessons.splice(lessonIndex, 1)

          const res = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
          setCourse(res.data?.data || { ...course, curriculum: updatedCurriculum })
          toast.success('Topic deleted successfully!', { id: toastId })
        } catch (err) {
          toast.error('Failed to delete topic', { id: toastId })
        }
      }
    )
  }

  // ── Note / File Upload Actions ──
  const handleUpload = async (e, sectionIndex, lessonIndex, lessonId) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ]
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toast.error('Only PDF, Word, or Text files are supported')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploadingLessonId(lessonId)
    const toastId = toast.loading(`Uploading "${file.name}"...`)

    try {
      const { data } = await api.post('/upload/resource', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const updatedCurriculum = JSON.parse(JSON.stringify(course.curriculum))
      const targetLesson = updatedCurriculum[sectionIndex].lessons[lessonIndex]
      
      const newResource = { name: file.name, url: data.url }
      targetLesson.resources = [...(targetLesson.resources || []), newResource]

      const updateRes = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
      setCourse(updateRes.data?.data || { ...course, curriculum: updatedCurriculum })
      
      toast.success('Notes uploaded successfully!', { id: toastId })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload notes', { id: toastId })
    } finally {
      setUploadingLessonId(null)
    }
  }

  const handleDeleteResource = (sectionIndex, lessonIndex, resourceIndex, resourceName) => {
    triggerConfirm(
      'Remove File',
      `Are you sure you want to remove the file "${resourceName}"?`,
      async () => {
        const toastId = toast.loading('Removing resource...')
        try {
          const updatedCurriculum = JSON.parse(JSON.stringify(course.curriculum))
          const targetLesson = updatedCurriculum[sectionIndex].lessons[lessonIndex]
          
          targetLesson.resources.splice(resourceIndex, 1)

          const updateRes = await coursesAPI.update(course._id, { curriculum: updatedCurriculum })
          setCourse(updateRes.data?.data || { ...course, curriculum: updatedCurriculum })
          
          toast.success('Notes removed successfully!', { id: toastId })
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to remove notes', { id: toastId })
        }
      }
    )
  }

  // ── WH Questions Actions ──
  const handleOpenWHModal = (sectionIndex, lessonIndex, resourceUrl, resourceName, existingQuestions = null) => {
    setWhModalState({
      isOpen: true,
      step: existingQuestions && existingQuestions.length > 0 ? 'edit' : 'setup',
      questions: existingQuestions ? [...existingQuestions] : [],
      sectionIndex,
      lessonIndex,
      resourceUrl,
      resourceName,
      numQuestions: existingQuestions ? existingQuestions.length : 5,
    })
  }

  const handleGenerateWH = async () => {
    const { sectionIndex, lessonIndex, resourceUrl, numQuestions } = whModalState
    setWhModalState(prev => ({ ...prev, step: 'generating' }))

    try {
      const res = await api.post(`/courses/${course._id}/sections/${sectionIndex}/lessons/${lessonIndex}/generate-wh`, { 
        pdfUrl: resourceUrl,
        numQuestions 
      })
      setWhModalState(prev => ({
        ...prev,
        step: 'edit',
        questions: res.data.data
      }))
    } catch (err) {
      toast.error('Failed to generate WH questions')
      setWhModalState(prev => ({ ...prev, step: 'setup' }))
    }
  }

  const handlePublishWH = async () => {
    const { sectionIndex, lessonIndex, questions } = whModalState
    const toastId = toast.loading('Publishing WH Questions...')
    try {
      const res = await api.put(`/courses/${course._id}/sections/${sectionIndex}/lessons/${lessonIndex}/wh-questions`, { whQuestions: questions })
      setCourse(res.data.data)
      toast.success('WH Questions published to the module!', { id: toastId })
      setWhModalState(prev => ({ ...prev, isOpen: false }))
    } catch (err) {
      toast.error('Failed to publish WH questions', { id: toastId })
    }
  }

  const handleWHChange = (index, field, value) => {
    setWhModalState(prev => {
      const updated = [...prev.questions]
      updated[index][field] = value
      return { ...prev, questions: updated }
    })
  }

  // Filter sections and lessons by search query
  const filteredCurriculum = course?.curriculum?.map((section) => {
    const matchedLessons = section.lessons?.filter(lesson => 
      lesson.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []
    
    return {
      ...section,
      lessons: matchedLessons,
      hasMatch: matchedLessons.length > 0 || section.title?.toLowerCase().includes(searchQuery.toLowerCase())
    }
  }).filter(section => section.hasMatch) || []

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-6">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/instructor/courses')}
          className="flex items-center gap-1.5 text-sm font-medium mb-4 hover:text-[#7C3AED] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          Back to Courses
        </button>

        {loading ? (
          <div className="space-y-4">
            <div className="skeleton h-12 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-1/2 rounded-xl" />
            <div className="skeleton h-64 rounded-2xl mt-8" />
          </div>
        ) : !course ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Course Not Found</h2>
          </div>
        ) : (
          <div>
            {/* Header info */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                  Manage Study Notes
                </h1>
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  Course: <span className="font-semibold text-[#7C3AED]">{course.title}</span>
                </p>
              </div>

              {/* Search & Actions Row */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border focus:outline-none transition-colors"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                
                <Button 
                  onClick={() => setIsAddingSection(true)} 
                  variant="primary" 
                  size="sm"
                  className="w-full md:w-auto flex items-center justify-center gap-1.5"
                >
                  <FolderPlus size={15} />
                  Add Section
                </Button>
              </div>
            </div>

            {/* Inline Add Section Form */}
            <AnimatePresence>
              {isAddingSection && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 border rounded-2xl bg-white mb-6 space-y-4 shadow-sm"
                  style={{ background: 'var(--bg-surface)', borderColor: '#7C3AED' }}
                >
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Create New Notes Section
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <input 
                      type="text" 
                      value={newSectionTitle} 
                      onChange={e => setNewSectionTitle(e.target.value)} 
                      placeholder="e.g., Chapter 1: Basic Principles, Syllabus & Guides" 
                      className="w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:border-[#7C3AED] transition-colors" 
                      style={{ background: 'var(--bg-page)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setIsAddingSection(false); setNewSectionTitle('') }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddSection}>
                      Create Section
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Curriculum Notes Section */}
            {filteredCurriculum.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl bg-white" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-purple-50 dark:bg-purple-950/20">
                  <BookOpenCheck size={26} color="#7C3AED" />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  No matching sections or topics
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {searchQuery ? 'Try adjusting your search query.' : 'Add your first Section above to start organizing notes!'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCurriculum.map((section, sectionIndex) => {
                  const secId = section._id || `sec-${sectionIndex}`
                  const isExpanded = expandedSections[secId] !== false
                  const isEditingThisSection = editingSectionId === secId

                  return (
                    <div 
                      key={secId} 
                      className="border rounded-2xl overflow-hidden bg-white shadow-sm transition-all"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                    >
                      {/* Section Header */}
                      <div 
                        className="p-4 flex items-center justify-between gap-4"
                        style={{ backgroundColor: 'var(--bg-hover)', borderBottom: isExpanded ? '1px solid var(--border-default)' : 'none' }}
                      >
                        {isEditingThisSection ? (
                          <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editSectionTitle}
                              onChange={(e) => setEditSectionTitle(e.target.value)}
                              className="px-3 py-1.5 text-sm rounded-lg border focus:outline-none"
                              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                              autoFocus
                            />
                            <Button size="xs" onClick={() => handleRenameSection(sectionIndex, secId)}>Save</Button>
                            <Button size="xs" variant="outline" onClick={() => { setEditingSectionId(null); setEditSectionTitle('') }}>Cancel</Button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => toggleSection(secId)}
                            className="flex-1 flex items-center gap-3 cursor-pointer"
                          >
                            <BookOpen size={18} className="text-[#7C3AED]" />
                            <h3 className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>
                              {section.title}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] font-semibold shrink-0">
                              {section.lessons?.length || 0} Topics
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {!isEditingThisSection && (
                            <>
                              <button
                                onClick={() => { setEditingSectionId(secId); setEditSectionTitle(section.title) }}
                                title="Rename Section"
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSection(sectionIndex, section.title)}
                                title="Delete Section"
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <div onClick={() => toggleSection(secId)} className="cursor-pointer p-1.5 text-gray-400">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Section Lessons List */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="divide-y divide-gray-100 dark:divide-gray-800" style={{ borderColor: 'var(--border-default)' }}>
                              {section.lessons && section.lessons.length > 0 ? (
                                section.lessons.map((lesson, lessonIndex) => {
                                  const isUploadingThis = uploadingLessonId === lesson._id
                                  const isEditingThisLesson = editingLessonId === lesson._id

                                  return (
                                    <div key={lesson._id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      {/* Lesson / Topic Details */}
                                      <div className="flex-1">
                                        {isEditingThisLesson ? (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="text"
                                              value={editLessonTitle}
                                              onChange={(e) => setEditLessonTitle(e.target.value)}
                                              className="px-3 py-1.5 text-sm rounded-lg border focus:outline-none"
                                              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                                              autoFocus
                                            />
                                            <Button size="xs" onClick={() => handleRenameLesson(sectionIndex, lessonIndex)}>Save</Button>
                                            <Button size="xs" variant="outline" onClick={() => { setEditingLessonId(null); setEditLessonTitle('') }}>Cancel</Button>
                                          </div>
                                        ) : (
                                          <h4 className="text-sm font-bold flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-primary)' }}>
                                            <span>{lesson.title}</span>
                                            {lesson.resources && lesson.resources.length > 0 ? (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                                                <CheckCircle2 size={10} /> {lesson.resources.length} Notes Uploaded
                                              </span>
                                            ) : (
                                              <span className="text-[10px] font-normal text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                                                No Notes Uploaded
                                              </span>
                                            )}
                                          </h4>
                                        )}
                                        
                                        {/* Resources Files List */}
                                        {lesson.resources && lesson.resources.length > 0 && (
                                          <div className="mt-2.5 space-y-2">
                                            {lesson.resources.map((res, rIdx) => (
                                              <div 
                                                key={res._id || rIdx}
                                                className="flex items-center justify-between p-2.5 rounded-xl border border-dashed transition-all"
                                                style={{ background: 'var(--bg-page)', borderColor: 'var(--border-default)' }}
                                              >
                                                <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                  <FileText size={16} className="text-red-500 shrink-0" />
                                                  <span className="text-xs font-semibold truncate text-gray-700 dark:text-gray-300" title={res.name}>
                                                    {res.name}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  {lesson.whQuestions && lesson.whQuestions.length > 0 ? (
                                                    <button
                                                      onClick={() => handleOpenWHModal(sectionIndex, lessonIndex, res.url, res.name, lesson.whQuestions)}
                                                      title="Edit WH Questions"
                                                      className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                      <Edit2 size={12} /> Edit WH
                                                    </button>
                                                  ) : (
                                                    <button
                                                      onClick={() => handleOpenWHModal(sectionIndex, lessonIndex, res.url, res.name)}
                                                      title="Generate WH Questions"
                                                      className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                      <Sparkles size={12} /> Gen WH
                                                    </button>
                                                  )}
                                                  <a 
                                                    href={res.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    title="View or Download Note"
                                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-[#7C3AED] transition-colors"
                                                  >
                                                    <Download size={14} />
                                                  </a>
                                                  <button
                                                    onClick={() => handleDeleteResource(sectionIndex, lessonIndex, rIdx, res.name)}
                                                    title="Remove File"
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500 transition-colors"
                                                  >
                                                    <Trash2 size={14} />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Action Buttons for Lesson */}
                                      <div className="shrink-0 flex items-center gap-2">
                                        {!isEditingThisLesson && (
                                          <>
                                            <button
                                              onClick={() => { setEditingLessonId(lesson._id); setEditLessonTitle(lesson.title) }}
                                              title="Rename Topic"
                                              className="p-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500"
                                              style={{ borderColor: 'var(--border-default)' }}
                                            >
                                              <Edit2 size={14} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteLesson(sectionIndex, lessonIndex, lesson.title)}
                                              title="Delete Topic"
                                              className="p-2 border rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-500"
                                              style={{ borderColor: 'var(--border-default)' }}
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </>
                                        )}

                                        <label 
                                          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer select-none transition-all shadow-sm ${
                                            isUploadingThis 
                                              ? 'opacity-60 cursor-not-allowed' 
                                              : 'hover:border-[#7C3AED] hover:text-[#7C3AED]'
                                          }`}
                                          style={{ 
                                            borderColor: 'var(--border-default)', 
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-secondary)'
                                          }}
                                        >
                                          {isUploadingThis ? (
                                            <>
                                              <Loader2 size={14} className="animate-spin text-[#7C3AED]" />
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <UploadCloud size={14} />
                                              Upload Notes
                                            </>
                                          )}
                                          <input
                                            type="file"
                                            accept=".pdf,.docx,.doc,.txt"
                                            disabled={isUploadingThis}
                                            onChange={(e) => handleUpload(e, sectionIndex, lessonIndex, lesson._id)}
                                            className="hidden"
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  )
                                })
                              ) : (
                                <div className="p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                  No topics in this section yet. Add a note topic or lesson below!
                                </div>
                              )}

                              {/* Add Lesson / Topic Inline Action */}
                              {addingLessonToSection === secId ? (
                                <div className="p-4 bg-gray-50 dark:bg-purple-950/10 space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <input 
                                      type="text" 
                                      value={newLessonTitle} 
                                      onChange={e => setNewLessonTitle(e.target.value)} 
                                      placeholder="e.g., Week 1 Study Material, Chapter 1 Homework Key" 
                                      className="w-full px-4 py-2 text-sm rounded-xl border focus:outline-none focus:border-[#7C3AED] transition-colors" 
                                      style={{ background: 'var(--bg-page)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                                      autoFocus
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => { setAddingLessonToSection(null); setNewLessonTitle('') }}>
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleAddLesson(sectionIndex)}>
                                      Add Topic
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => { setAddingLessonToSection(secId); setNewLessonTitle('') }}
                                  className="w-full py-3.5 border-t border-dashed text-xs font-bold text-center flex items-center justify-center gap-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/10 transition-colors"
                                  style={{ color: '#7C3AED', borderColor: 'var(--border-default)' }}
                                >
                                  <Plus size={14} /> Add Note Topic or Lesson
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Custom Theme Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmState.onConfirm}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel="Delete"
          confirmVariant="danger"
        />

        {/* Glassmorphism Modal for WH Questions */}
        <AnimatePresence>
          {whModalState.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/40"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white/90 dark:bg-gray-900/90 w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800/50 bg-white/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        AI Generated Questions
                      </h2>
                      <p className="text-xs text-gray-500">From: {whModalState.resourceName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setWhModalState(prev => ({ ...prev, isOpen: false }))}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {whModalState.step === 'setup' && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800/30">
                        <Brain size={32} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>Configure Generation</h3>
                      <p className="text-sm text-gray-500 text-center max-w-sm mb-8">
                        How many WH (Who, What, Where, When, Why) questions would you like the AI to extract from this document?
                      </p>
                      
                      <div className="w-full max-w-md bg-white dark:bg-gray-800/60 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Number of Questions</label>
                          <span className="text-lg font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-xl">
                            {whModalState.numQuestions}
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="2" 
                          max="20" 
                          value={whModalState.numQuestions}
                          onChange={(e) => setWhModalState(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-gray-700"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                          <span>2 min</span>
                          <span>20 max</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleGenerateWH}
                        className="mt-8 flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Sparkles size={18} /> Start Generating
                      </button>
                    </div>
                  )}

                  {whModalState.step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="relative w-24 h-24 mb-8">
                        {/* Outer rotating ring */}
                        <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                        {/* Inner rotating ring (opposite direction) */}
                        <div className="absolute inset-2 border-4 border-t-purple-400 border-l-transparent border-b-indigo-400 border-r-transparent rounded-full animate-[spin_1s_linear_infinite_reverse]"></div>
                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full scale-75 shadow-inner">
                          <Brain size={28} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Reading Document...</h3>
                      <div className="w-64 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-6 overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[ping_1.5s_ease-in-out_infinite] opacity-50"></div>
                        <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[slide_1s_ease-in-out_infinite_alternate]"></div>
                      </div>
                      <style>{`
                        @keyframes slide {
                          from { left: 0%; }
                          to { left: 66%; }
                        }
                      `}</style>
                      <p className="text-sm text-gray-500 mt-5 text-center max-w-sm">
                        Extracting core concepts and forming {whModalState.numQuestions} WH questions.
                      </p>
                    </div>
                  )}

                  {whModalState.step === 'edit' && (
                    <div className="space-y-6">
                      {whModalState.questions.map((q, idx) => (
                        <div key={idx} className="bg-white/60 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm space-y-4 relative group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                          <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm border border-indigo-200 dark:border-indigo-800/30">
                            {idx + 1}
                          </div>
                          <div className="pl-2">
                            <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              Question
                            </label>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) => handleWHChange(idx, 'question', e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-800 dark:text-gray-100"
                            />
                          </div>
                          <div className="pl-2">
                            <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              Answer
                            </label>
                            <textarea
                              value={q.answer}
                              onChange={(e) => handleWHChange(idx, 'answer', e.target.value)}
                              rows={3}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-gray-700 dark:text-gray-300 leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {whModalState.step === 'edit' && (
                  <div className="p-5 border-t border-gray-200 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Sparkles size={14} className="text-indigo-500" /> {whModalState.questions.length} Generated
                    </span>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setWhModalState(prev => ({ ...prev, step: 'setup' }))} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
                        <RefreshCw size={16} /> Regenerate
                      </Button>
                      <Button variant="outline" onClick={() => setWhModalState(prev => ({ ...prev, isOpen: false }))}>
                        Discard
                      </Button>
                      <Button onClick={handlePublishWH} className="flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                        <Save size={16} /> Save to Module
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageLayout>
  )
}
