import React, { useEffect, useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Globe,
  GraduationCap,
  Briefcase,
  Building,
  Clock,
  BookOpen,
  Video,
  FileText,
  UploadCloud,
  X,
  Check,
  Search,
  ChevronDown,
  CheckCircle2,
  DollarSign,
  Users,
  AlertCircle,
  FileCheck,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react'

// Custom Brand Icons for LinkedIn & GitHub
const LinkedInIcon = ({ size = 16, className = "text-purple-600" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
)

const GitHubIcon = ({ size = 16, className = "text-purple-600" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
  </svg>
)
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import TagInput from '../../components/ui/TagInput.jsx'
import { usersAPI } from '../../api/users.js'
import useAuthStore from '../../store/authStore.js'
import toast from 'react-hot-toast'

// Form Validation Schema
const schema = z.object({
  fullName: z.string().trim().min(3, 'Full Name must be at least 3 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, 'Phone number must contain only digits (10 to 15 digits)'),
  country: z.string().default('India'),
  department: z.string().min(1, 'Please select a department / subject area'),
  qualification: z.string().min(1, 'Please select your highest qualification'),
  occupation: z.string().trim().min(1, 'Please enter your current occupation'),
  organization: z.string().trim().optional(),
  experience: z.string().min(1, 'Please select your total teaching experience'),
  topics: z.array(z.string()).min(1, 'Please add at least one topic you want to teach'),
  teachingMode: z.string().min(1, 'Please select a teaching mode'),
  languages: z.array(z.string()).min(1, 'Please select at least one language'),
  bio: z
    .string()
    .trim()
    .min(1, 'Professional bio is required')
    .max(500, 'Professional bio cannot exceed 500 characters'),
  motivation: z
    .string()
    .trim()
    .min(100, 'Motivation must be at least 100 characters')
    .max(1000, 'Motivation cannot exceed 1000 characters'),
  linkedin: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
      message: 'Please enter a valid URL (e.g. https://linkedin.com/in/username)',
    }),
  portfolio: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
      message: 'Please enter a valid URL (e.g. https://github.com/username)',
    }),
  resume: z
    .any()
    .refine((val) => !!val, { message: 'Upload your latest resume in PDF format (max 5 MB)' }),
})

const DEPARTMENT_OPTIONS = [
  'Computer Science',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'Cloud Computing',
  'Cyber Security',
  'DevOps',
  'Business',
  'Finance',
  'Marketing',
  'Design',
  'Others',
]

const QUALIFICATION_OPTIONS = [
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other',
]

const EXPERIENCE_OPTIONS = [
  'Fresher',
  'Less than 1 Year',
  '1–3 Years',
  '3–5 Years',
  '5–10 Years',
  '10+ Years',
]

const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Gujarati',
  'Bengali',
  'Kannada',
  'Malayalam',
  'Punjabi',
]

const TEACHING_MODES = [
  { id: 'Recorded Courses', label: 'Recorded Courses', desc: 'Pre-recorded structured video lectures' },
  { id: 'Live Classes', label: 'Live Classes', desc: 'Real-time interactive live video sessions' },
  { id: 'Both', label: 'Both', desc: 'Flexible combination of live and recorded content' },
]

const BENEFITS = [
  { icon: Users, text: 'Reach 50,000+ active learners worldwide' },
  { icon: DollarSign, text: 'Earn competitive revenue share on enrollments' },
  { icon: Clock, text: 'Flexible teaching schedule on your own terms' },
  { icon: BookOpen, text: 'Comprehensive AI course-building tools included' },
]

export default function BecomeInstructor() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: 'India',
      department: '',
      qualification: '',
      occupation: '',
      organization: '',
      experience: '',
      topics: [],
      teachingMode: 'Both',
      languages: ['English'],
      bio: '',
      motivation: '',
      linkedin: '',
      portfolio: '',
      resume: null,
    },
  })

  useEffect(() => {
    usersAPI
      .getRequestStatus()
      .then(({ data }) => setStatus(data.data?.status || 'none'))
      .catch(() => setStatus('none'))
      .finally(() => setLoading(false))
  }, [])

  const onSubmit = async (values) => {
    try {
      await usersAPI.becomeInstructor({
        ...values,
        expertise: values.topics,
        fullName: values.fullName,
        email: values.email,
      })
      setStatus('pending')
      setSubmittedSuccess(true)
      updateUser({ instructorRequestStatus: 'pending' })
      toast.success('Instructor application submitted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.')
    }
  }

  return (
    <PageLayout>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-main, #F8FAFC)' }}>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3"
              style={{ background: 'var(--z-purple-100, #EDE9FE)', color: '#7C3AED' }}>
              <Sparkles size={14} />
              <span>Zenius AI Instructor Network</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
              style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary, #0F172A)' }}>
              Teach on Zenius AI
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Join our community of expert educators. Empower students globally with interactive courses, live sessions, and AI tools.
            </p>

            {/* Benefits Row */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-purple-100/60 dark:border-slate-700/50 shadow-sm">
                  <div className="p-1.5 rounded-lg shrink-0" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-slate-700 dark:text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Card Container */}
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="skeleton h-[600px] rounded-2xl" />
            ) : (user?.role === 'instructor' && user?.isApprovedInstructor) || user?.role === 'admin' ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl text-center border border-purple-100 dark:border-slate-800"
              >
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ background: '#EDE9FE' }}>
                  <CheckCircle2 size={40} color="#7C3AED" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                  You're an Approved Instructor!
                </h2>
                <p className="text-sm max-w-md mx-auto mb-6 text-slate-600 dark:text-slate-400">
                  You already have full instructor permissions on Zenius AI. You can create courses, conduct live sessions, and track student analytics.
                </p>
                <Button
                  onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard')}
                  className="px-8 py-3 rounded-xl font-semibold shadow-md transition-all hover:scale-[1.02]"
                >
                  Go to Instructor Dashboard
                </Button>
              </motion.div>
            ) : status === 'pending' || submittedSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl text-center border border-purple-200 dark:border-slate-800 max-w-2xl mx-auto"
              >
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)' }}>
                  <FileCheck size={38} color="#FFFFFF" />
                </div>
                <Badge variant="amber" className="mb-4 text-xs tracking-wider uppercase px-3 py-1">Application Pending Review</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                  Application Submitted Successfully!
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
                  Your instructor application has been submitted successfully! Our team will review your application and contact you soon via email.
                </p>
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-slate-800/80 border border-purple-100 dark:border-slate-700 text-xs text-purple-900 dark:text-purple-300 flex items-center gap-3 text-left mb-6">
                  <AlertCircle size={20} className="shrink-0 text-purple-600" />
                  <span>Applications are evaluated within 2–3 business days. You will receive notification on your registered email address ({user?.email}).</span>
                </div>
                <Button onClick={() => navigate('/dashboard')} variant="secondary" className="px-6 py-2.5 rounded-xl text-sm font-medium">
                  Return to Dashboard
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800"
              >
                {status === 'rejected' && (
                  <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Previous Application Update</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        Your previous instructor application was not approved. You are welcome to update your information and re-apply.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                      Instructor Onboarding Application
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Please fill out all required fields (*). All details are stored securely.
                    </p>
                  </div>
                  <Badge variant="purple" className="hidden sm:inline-flex px-3 py-1">Step 1 of 1</Badge>
                </div>

                <InstructorForm
                  register={register}
                  handleSubmit={handleSubmit}
                  setValue={setValue}
                  watch={watch}
                  control={control}
                  errors={errors}
                  isSubmitting={isSubmitting}
                  onSubmit={onSubmit}
                  user={user}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function InstructorForm({
  register,
  handleSubmit,
  setValue,
  watch,
  control,
  errors,
  isSubmitting,
  onSubmit,
  user,
}) {
  const watchBio = watch('bio', '')
  const watchMotivation = watch('motivation', '')
  const watchTeachingMode = watch('teachingMode', 'Both')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
      
      {/* SECTION 1: Personal Information */}
      <FormSection number="1" title="Personal Information" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <FormField label="Full Name" required icon={User} error={errors.fullName?.message}>
            <input
              type="text"
              id="fullName"
              placeholder="Your Full Name"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all outline-none bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white ${
                errors.fullName ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
              }`}
              {...register('fullName')}
            />
          </FormField>

          {/* Email */}
          <FormField label="Email Address" required icon={Mail} error={errors.email?.message}>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all outline-none bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white ${
                errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
              }`}
              {...register('email')}
            />
          </FormField>

          {/* Phone */}
          <FormField label="Phone Number" required icon={Phone} error={errors.phone?.message} hint="Enter digits only (10 to 15 digits)">
            <input
              type="tel"
              id="phone"
              placeholder="9876543210"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                errors.phone ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
              }`}
              {...register('phone')}
              onChange={(e) => {
                // Keep only numeric characters
                const digits = e.target.value.replace(/\D/g, '')
                setValue('phone', digits, { shouldValidate: true })
              }}
            />
          </FormField>

          {/* Country (Read-Only) */}
          <FormField label="Country" required icon={Globe} error={errors.country?.message} hint="Platform currently accepts instructors from India only">
            <div className="relative">
              <input
                type="text"
                id="country"
                value="India"
                readOnly
                tabIndex={-1}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 cursor-not-allowed select-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:purple-300">
                IN
              </span>
            </div>
          </FormField>
        </div>
      </FormSection>

      {/* SECTION 2: Professional Information */}
      <FormSection number="2" title="Professional Information" icon={GraduationCap}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Department (Searchable Dropdown) */}
          <FormField label="Department / Subject Area" required icon={Briefcase} error={errors.department?.message}>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="department"
                  options={DEPARTMENT_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select or search department..."
                  error={!!errors.department}
                />
              )}
            />
          </FormField>

          {/* Highest Qualification */}
          <FormField label="Highest Qualification" required icon={GraduationCap} error={errors.qualification?.message}>
            <Controller
              name="qualification"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="qualification"
                  options={QUALIFICATION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select qualification..."
                  error={!!errors.qualification}
                />
              )}
            />
          </FormField>

          {/* Occupation */}
          <FormField label="Current Occupation" required icon={Briefcase} error={errors.occupation?.message}>
            <input
              type="text"
              id="occupation"
              placeholder="e.g. Software Engineer, Professor, Freelancer"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                errors.occupation ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
              }`}
              {...register('occupation')}
            />
          </FormField>

          {/* Organization */}
          <FormField label="Current Organization / Company" icon={Building} error={errors.organization?.message}>
            <input
              type="text"
              id="organization"
              placeholder="e.g. Google, University of Mumbai, Self-employed"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40 transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              {...register('organization')}
            />
          </FormField>

          {/* Total Teaching Experience */}
          <FormField label="Total Teaching Experience" required icon={Clock} error={errors.experience?.message} className="sm:col-span-2">
            <Controller
              name="experience"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="experience"
                  options={EXPERIENCE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select teaching experience level..."
                  error={!!errors.experience}
                />
              )}
            />
          </FormField>
        </div>
      </FormSection>

      {/* SECTION 3: Course Information */}
      <FormSection number="3" title="Course Information" icon={BookOpen}>
        <div className="space-y-5">
          {/* Topics You Want to Teach */}
          <FormField label="Topics You Want to Teach" required icon={BookOpen} error={errors.topics?.message} hint="Type a topic (e.g., Python, React, AWS) and press Enter">
            <Controller
              name="topics"
              control={control}
              render={({ field }) => (
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="e.g. Java, React, Machine Learning, System Design — press Enter"
                />
              )}
            />
          </FormField>

          {/* Teaching Mode (Radio Buttons) */}
          <FormField label="Teaching Mode" required icon={Video} error={errors.teachingMode?.message}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              {TEACHING_MODES.map((mode) => {
                const isSelected = watchTeachingMode === mode.id
                return (
                  <label
                    key={mode.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teachingMode"
                      value={mode.id}
                      checked={isSelected}
                      onChange={() => setValue('teachingMode', mode.id, { shouldValidate: true })}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{mode.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mode.desc}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </FormField>

          {/* Languages You Can Teach In */}
          <FormField label="Languages You Can Teach In" required icon={Globe} error={errors.languages?.message} hint="Select at least one language">
            <Controller
              name="languages"
              control={control}
              render={({ field }) => (
                <MultiSelectDropdown
                  id="languages"
                  options={LANGUAGE_OPTIONS}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select teaching languages..."
                  error={!!errors.languages}
                />
              )}
            />
          </FormField>
        </div>
      </FormSection>

      {/* SECTION 4: About Yourself */}
      <FormSection number="4" title="About Yourself" icon={FileText}>
        <div className="space-y-5">
          {/* Professional Bio */}
          <FormField label="Professional Bio" required icon={User} error={errors.bio?.message}>
            <div className="relative">
              <textarea
                id="bio"
                rows={3}
                maxLength={500}
                placeholder="Tell students about your background, expertise, achievements, teaching style, and teaching philosophy..."
                className={`w-full p-3.5 text-sm rounded-xl border transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none ${
                  errors.bio ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
                }`}
                {...register('bio')}
              />
              <div className="flex justify-end mt-1 text-xs text-slate-400">
                <span className={watchBio.length > 450 ? 'text-amber-600 font-semibold' : ''}>
                  {watchBio.length} / 500 characters
                </span>
              </div>
            </div>
          </FormField>

          {/* Why do you want to teach? */}
          <FormField label="Why do you want to teach on Zenius AI?" required icon={Sparkles} error={errors.motivation?.message}>
            <div className="relative">
              <textarea
                id="motivation"
                rows={4}
                minLength={100}
                maxLength={1000}
                placeholder="Explain your motivation for joining Zenius AI, how you can help students, and what value you will bring to the platform."
                className={`w-full p-3.5 text-sm rounded-xl border transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none ${
                  errors.motivation ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
                }`}
                {...register('motivation')}
              />
              <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
                <span>Minimum 100 characters required</span>
                <span className={watchMotivation.length < 100 ? 'text-amber-600 font-medium' : 'text-slate-400'}>
                  {watchMotivation.length} / 1000 characters
                </span>
              </div>
            </div>
          </FormField>
        </div>
      </FormSection>

      {/* SECTION 5: Professional Links */}
      <FormSection number="5" title="Professional Links" icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* LinkedIn Profile */}
          <FormField label="LinkedIn Profile" icon={LinkedInIcon} error={errors.linkedin?.message}>
            <input
              type="url"
              id="linkedin"
              placeholder="https://linkedin.com/in/username"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                errors.linkedin ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
              }`}
              {...register('linkedin')}
            />
          </FormField>

          {/* GitHub / Portfolio */}
          <FormField label="GitHub / Portfolio Website" icon={GitHubIcon} error={errors.portfolio?.message}>
            <input
              type="url"
              id="portfolio"
              placeholder="https://github.com/username"
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                errors.portfolio ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40'
              }`}
              {...register('portfolio')}
            />
          </FormField>
        </div>
      </FormSection>

      {/* SECTION 6: Resume Upload */}
      <FormSection number="6" title="Resume Upload" icon={UploadCloud}>
        <FormField label="Resume (PDF only, Max 5 MB)" required icon={FileText} error={errors.resume?.message} hint="Upload your latest resume in PDF format.">
          <Controller
            name="resume"
            control={control}
            render={({ field }) => (
              <ResumeDropzone
                value={field.value}
                onChange={field.onChange}
                error={!!errors.resume}
              />
            )}
          />
        </FormField>
      </FormSection>

      {/* Form Submission Button */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl text-base font-semibold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={19} />
              <span>Submit Application</span>
            </>
          )}
        </Button>
        <p className="text-center text-xs text-slate-400 mt-3">
          By submitting, you agree to Zenius AI Instructor Terms of Service and Privacy Policy.
        </p>
      </div>
    </form>
  )
}

// Sub-component: Form Section Layout
function FormSection({ number, title, icon: Icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">
          {number}
        </div>
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          <Icon size={18} className="text-purple-600" />
          <span>{title}</span>
        </h3>
      </div>
      <div>{children}</div>
    </div>
  )
}

// Sub-component: Form Field Wrapper with Icons & Red Errors
function FormField({ label, required, icon: Icon, error, hint, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      )}
    </div>
  )
}

// Sub-component: Searchable Select Dropdown
function SearchableSelect({ id, options, value, onChange, placeholder, error }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase().trim())
  )

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full pl-10 pr-10 py-2.5 text-sm text-left rounded-xl border transition-all flex items-center justify-between bg-white dark:bg-slate-800 ${
          error
            ? 'border-red-500 ring-2 ring-red-100'
            : open
            ? 'border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/40'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
      >
        <span className={value ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
              <Search size={14} className="text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs py-1 outline-none text-slate-900 dark:text-white"
                autoFocus
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="p-0.5 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto p-1 text-sm">
              {filtered.length === 0 ? (
                <div className="p-3 text-xs text-center text-slate-400">No matching option found</div>
              ) : (
                filtered.map((opt) => {
                  const selected = opt === value
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onChange(opt)
                        setOpen(false)
                        setSearch('')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm transition-colors ${
                        selected
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span>{opt}</span>
                      {selected && <Check size={14} className="text-purple-600 shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Sub-component: Standard Custom Select Dropdown
function CustomSelect({ id, options, value, onChange, placeholder, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full pl-10 pr-10 py-2.5 text-sm text-left rounded-xl border transition-all flex items-center justify-between bg-white dark:bg-slate-800 ${
          error
            ? 'border-red-500 ring-2 ring-red-100'
            : open
            ? 'border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/40'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
      >
        <span className={value ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden p-1 max-h-56 overflow-y-auto"
          >
            {options.map((opt) => {
              const selected = opt === value
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm transition-colors ${
                    selected
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{opt}</span>
                  {selected && <Check size={14} className="text-purple-600 shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Sub-component: Multi-Select Dropdown (with chips & checkboxes)
function MultiSelectDropdown({ id, options, value = [], onChange, placeholder, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((item) => item !== opt))
    } else {
      onChange([...value, opt])
    }
  }

  const removeChip = (e, opt) => {
    e.stopPropagation()
    onChange(value.filter((item) => item !== opt))
  }

  return (
    <div ref={ref} className="relative w-full">
      <div
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full pl-10 pr-10 py-2 text-sm rounded-xl border min-h-[44px] transition-all flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 cursor-pointer ${
          error
            ? 'border-red-500 ring-2 ring-red-100'
            : open
            ? 'border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/40'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
      >
        {value.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          value.map((lang) => (
            <span
              key={lang}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            >
              {lang}
              <button
                type="button"
                onClick={(e) => removeChip(e, lang)}
                className="hover:text-purple-900 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
        <ChevronDown size={16} className={`absolute right-3 top-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden p-1 max-h-56 overflow-y-auto"
          >
            {options.map((opt) => {
              const selected = value.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm transition-colors ${
                    selected
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {selected && <Check size={12} />}
                    </div>
                    <span>{opt}</span>
                  </div>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Sub-component: Resume Drag-and-Drop Uploader
function ResumeDropzone({ value, onChange, error }) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const processFile = (file) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF format is accepted for resume upload.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the maximum limit of 5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onChange({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result,
      })
      toast.success(`Attached resume: ${file.name}`)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
          }
        }}
      />

      {value ? (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <FileCheck size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-xs">
                {value.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDF format • {formatSize(value.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Remove file"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
            error
              ? 'border-red-400 bg-red-50/30'
              : dragOver
              ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-400 hover:bg-purple-50/20'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-3">
            <UploadCloud size={24} />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            <span className="text-purple-600 font-bold">Click to browse</span> or drag and drop your PDF resume here
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports PDF format up to 5 MB
          </p>
        </div>
      )}
    </div>
  )
}
