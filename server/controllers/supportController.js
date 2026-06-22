import Support from '../models/Support.js'
import Notification from '../models/Notification.js'

// Student: Create support ticket
export const createTicket = async (req, res, next) => {
  try {
    const { subject, category, message } = req.body
    if (!subject || !category || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    const ticket = await Support.create({
      student: req.user._id,
      subject,
      category,
      message
    })

    res.status(201).json({ success: true, data: ticket })
  } catch (error) {
    next(error)
  }
}

// Student: Get own tickets
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Support.find({ student: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, data: tickets })
  } catch (error) {
    next(error)
  }
}

// Admin: Get all tickets
export const adminGetAllTickets = async (req, res, next) => {
  try {
    const tickets = await Support.find()
      .populate('student', 'fullName email avatar')
      .sort({ createdAt: -1 })
    res.json({ success: true, data: tickets })
  } catch (error) {
    next(error)
  }
}

// Admin: Reply to ticket
export const adminReplyTicket = async (req, res, next) => {
  try {
    const { reply } = req.body
    if (!reply) {
      return res.status(400).json({ success: false, message: 'Reply content is required' })
    }

    const ticket = await Support.findById(req.params.id)
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    ticket.status = 'replied'
    ticket.reply = reply
    ticket.readByStudent = false
    ticket.repliedBy = req.user._id
    ticket.repliedAt = new Date()
    await ticket.save()

    // Notify the student
    await Notification.create({
      recipient: ticket.student,
      type: 'general',
      title: 'Support Ticket Replied',
      message: `Your ticket "${ticket.subject}" has a new response from the admin.`,
      link: '/contact',
      actorName: 'Admin',
    })

    res.json({ success: true, data: ticket })
  } catch (error) {
    next(error)
  }
}

// Student: Mark ticket as read
export const markTicketAsRead = async (req, res, next) => {
  try {
    const ticket = await Support.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { readByStudent: true },
      { new: true }
    )
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }
    res.json({ success: true, data: ticket })
  } catch (error) {
    next(error)
  }
}
