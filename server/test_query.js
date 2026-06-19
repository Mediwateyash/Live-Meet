import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quiz from './models/Quiz.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Simulating student request
    const courseId = '6a344b2a9650615eb7cc0bd9';
    const studentId = new mongoose.Types.ObjectId('6a1d646196968812a7b1c374');
    
    let filter = { courseId };
    filter.$or = [
        { visibility: 'public' },
        { visibility: { $exists: false } },
        { visibility: 'private', createdBy: studentId }
    ];
    
    const quizzes = await Quiz.find(filter);
    console.log('Returned Quizzes for Student:', quizzes.length);
    quizzes.forEach(q => console.log(q.title));
    process.exit(0);
});
