import Notification from '../models/Notification.js'

// GET /api/notifications — paginated, newest first
export async function getNotifications(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50)
    const page  = Math.max(Number(req.query.page)  || 1, 1)
    const skip  = (page - 1) * limit

    const [notifications, total, unread] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ])

    res.json({ success: true, data: notifications, total, unread, page, pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// PATCH /api/notifications/:id/read — mark one as read
export async function markRead(req, res, next) {
  try {
    await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { read: true })
    res.json({ success: true })
  } catch (err) { next(err) }
}

// PATCH /api/notifications/read-all — mark all as read
export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true })
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/notifications/:id
export async function deleteNotification(req, res, next) {
  try {
    await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id })
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/notifications/clear-all
export async function clearAll(req, res, next) {
  try {
    await Notification.deleteMany({ recipient: req.user._id })
    res.json({ success: true })
  } catch (err) { next(err) }
}
