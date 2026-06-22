import React, { useEffect, useState } from 'react'
import { Search, Trash2, Shield, AlertTriangle } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Select from '../../components/ui/Select.jsx'
import { adminAPI } from '../../api/admin.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { formatDate } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

const ROLE_BADGE = { student: 'gray', instructor: 'purple', admin: 'blue' }

export default function AdminUsers() {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [role,     setRole]     = useState('')

  // Themed modals
  const [deleteModal, setDeleteModal] = useState(null)
  const [roleModal,   setRoleModal]   = useState(null)
  const [newRole,     setNewRole]     = useState('')
  const [deleting,    setDeleting]    = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const load = () => {
    setLoading(true)
    adminAPI.getUsers({ search: debouncedSearch, role })
      .then(({ data }) => setUsers(data.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [debouncedSearch, role])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.deleteUser(deleteModal._id)
      setUsers(u => u.filter(x => x._id !== deleteModal._id))
      toast.success('User deleted')
    } catch {
      toast.error('Could not delete user')
    } finally {
      setDeleting(false)
      setDeleteModal(null)
    }
  }

  const handleRoleChange = async () => {
    try {
      await adminAPI.updateUserRole(roleModal._id, { role: newRole })
      setUsers(u => u.map(x => x._id === roleModal._id ? { ...x, role: newRole } : x))
      toast.success('Role updated')
      setRoleModal(null)
    } catch {
      toast.error('Could not update role')
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Users</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 max-w-sm min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input-field" style={{ paddingLeft: '2.25rem' }} />
          </div>
          <Select
            value={role}
            onChange={setRole}
            placeholder="All roles"
            options={[
              { value: '', label: 'All roles' },
              { value: 'student', label: 'Student' },
              { value: 'instructor', label: 'Instructor' },
              { value: 'admin', label: 'Admin' },
            ]}
            className="w-40"
          />
        </div>

        {loading ? <div className="skeleton h-64 rounded-2xl" /> : users.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
            <p className="text-base font-medium">No users found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-card hidden md:block" style={{ border: '1px solid var(--border-default)' }}>
              <div className="table-responsive">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr style={{ background: '#EDE9FE', borderBottom: '1px solid var(--border-purple)' }}>
                      {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B21B6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u._id} className="transition-colors hover:bg-[#FAFAFE]" style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {u.avatar ? <img src={u.avatar} className="w-9 h-9 rounded-full" alt="" /> : (
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                                {u.fullName?.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td className="px-5 py-4"><Badge variant={ROLE_BADGE[u.role]}>{u.role}</Badge></td>
                        <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setRoleModal(u); setNewRole(u.role) }}
                              className="p-2 rounded-lg transition-all hover:bg-[#F0EEFF] hover:shadow-sm touch-target flex items-center justify-center"
                              title="Change role"
                            >
                              <Shield size={15} color="#7C3AED" />
                            </button>
                            <button
                              onClick={() => setDeleteModal(u)}
                              className="p-2 rounded-lg transition-all hover:bg-red-50 hover:shadow-sm touch-target flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 size={15} color="#EF4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="space-y-4 md:hidden">
              {users.map(u => (
                <div 
                  key={u._id} 
                  className="rounded-2xl p-4 shadow-sm border flex flex-col gap-3 bg-white"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                >
                  <div className="flex items-center gap-3">
                    {u.avatar ? <img src={u.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" /> : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                        {u.fullName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{u.fullName}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Role</span>
                      <Badge variant={ROLE_BADGE[u.role]}>{u.role}</Badge>
                    </div>
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Joined</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatDate(u.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-end border-t pt-3" style={{ borderColor: 'var(--border-default)' }}>
                    <button
                      onClick={() => { setRoleModal(u); setNewRole(u.role) }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold hover:bg-[#F0EEFF] transition-all touch-target"
                      style={{ color: '#7C3AED', borderColor: 'var(--border-purple)', background: 'var(--bg-surface)' }}
                    >
                      <Shield size={14} /> Role
                    </button>
                    <button
                      onClick={() => setDeleteModal(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold hover:bg-red-50 transition-all touch-target"
                      style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)', background: 'var(--bg-surface)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Themed Delete Confirm Modal */}
        <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete User" size="sm">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
              <AlertTriangle size={20} color="#DC2626" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#991B1B' }}>Are you sure?</p>
              <p className="text-sm" style={{ color: '#B91C1C' }}>
                This will permanently delete <strong>{deleteModal?.fullName}</strong> and all their data.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteModal(null)} disabled={deleting}>No, Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>Yes, Delete</Button>
          </div>
        </Modal>

        {/* Themed Role Change Modal */}
        <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="Change Role" size="sm">
          <div className="flex items-center gap-3 mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--z-purple-100)' }}>
              <Shield size={20} color="#7C3AED" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Change role for {roleModal?.fullName}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current: {roleModal?.role}</p>
            </div>
          </div>
          <Select
            value={newRole}
            onChange={setNewRole}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'instructor', label: 'Instructor' },
              { value: 'admin', label: 'Admin' },
            ]}
            className="mb-4"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button size="sm" onClick={handleRoleChange}>Update Role</Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  )
}
