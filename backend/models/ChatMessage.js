import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveClass',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    recipientName: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
