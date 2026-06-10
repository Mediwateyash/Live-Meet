import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mcqs-generator');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users.');

        // Seed users
        const users = [
            {
                name: 'Test Student',
                email: 'student@test.com',
                password: 'password123',
                role: 'student',
                class: '10th',
                batch: 'Batch B',
                isApproved: true
            },
            {
                name: 'Test Teacher',
                email: 'teacher@test.com',
                password: 'password123',
                role: 'teacher',
                isApproved: true
            },
            {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'password123',
                role: 'admin',
                isApproved: true
            }
        ];

        await User.create(users);
        console.log('Seeded 3 users: student@test.com, teacher@test.com, admin@test.com');
        
        mongoose.connection.close();
        console.log('Database seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
