import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, AlertTriangle, Star } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import { testimonialAPI } from '../../api/testimonial.js'
import toast from 'react-hot-toast'

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ content: '', author: '', role: '', avatar: '', rating: 5 })
  const [saving, setSaving] = useState(false)

  const [deleteModal, setDeleteModal] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = () => {
    setLoading(true)
    testimonialAPI.getAdminAll()
      .then(({ data }) => setTestimonials(data.data || []))
      .catch(() => toast.error('Failed to load testimonials'))
      .finally(() => setLoading(false))
  }

  const filtered = testimonials.filter(t => 
    t.author.toLowerCase().includes(search.toLowerCase()) || 
    t.content.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditingId(null)
    setFormData({ content: '', author: '', role: '', avatar: '', rating: 5 })
    setModalOpen(true)
  }

  const openEdit = (t) => {
    setEditingId(t._id)
    setFormData({ content: t.content, author: t.author, role: t.role, avatar: t.avatar, rating: t.rating })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await testimonialAPI.update(editingId, formData)
        toast.success('Testimonial updated')
      } else {
        await testimonialAPI.create(formData)
        toast.success('Testimonial created')
      }
      setModalOpen(false)
      fetchTestimonials()
    } catch {
      toast.error('Failed to save testimonial')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await testimonialAPI.delete(deleteModal._id)
      setTestimonials(t => t.filter(x => x._id !== deleteModal._id))
      toast.success('Testimonial deleted')
    } catch {
      toast.error('Failed to delete testimonial')
    } finally {
      setDeleting(false)
      setDeleteModal(null)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Platform Reviews
          </h1>
          <Button onClick={openAdd} className="flex items-center gap-2">
            <Plus size={18} /> Add Review
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          />
        </div>

        {loading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <p className="text-gray-500 font-medium">No reviews found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-card border" style={{ borderColor: 'var(--border-default)' }}>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b" style={{ borderColor: 'var(--border-purple)' }}>
                <tr>
                  <th className="px-6 py-4 font-semibold text-purple-800 uppercase tracking-wider text-xs">Author</th>
                  <th className="px-6 py-4 font-semibold text-purple-800 uppercase tracking-wider text-xs">Role</th>
                  <th className="px-6 py-4 font-semibold text-purple-800 uppercase tracking-wider text-xs">Content</th>
                  <th className="px-6 py-4 font-semibold text-purple-800 uppercase tracking-wider text-xs">Rating</th>
                  <th className="px-6 py-4 font-semibold text-purple-800 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                {filtered.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                          {t.avatar || t.author.charAt(0)}
                        </div>
                        {t.author}
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{t.role}</td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 w-64 text-gray-600" title={t.content}>{t.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex text-yellow-400">
                        {[...Array(t.rating || 5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(t)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteModal(t)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Review' : 'Add Review'} size="md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Author Name</label>
              <input required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="input-field w-full" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Role / Title</label>
              <input required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="input-field w-full" placeholder="Software Engineer" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Avatar Letter (Optional)</label>
              <input maxLength={1} value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} className="input-field w-full" placeholder="J" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Rating (1-5)</label>
              <input type="number" min="1" max="5" required value={formData.rating} onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Review Content</label>
              <textarea required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="input-field w-full h-24 resize-none" placeholder="Write the review..." />
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editingId ? 'Save Changes' : 'Add Review'}</Button>
            </div>
          </form>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Review" size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-100"><AlertTriangle size={20} color="#DC2626" /></div>
            <div>
              <p className="text-sm font-bold text-red-800">Are you sure?</p>
              <p className="text-sm text-red-700">This will permanently delete this review.</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteModal(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  )
}
