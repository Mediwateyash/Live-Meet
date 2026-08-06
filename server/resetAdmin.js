import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('Admin@1234', 12);
  const result = await db.collection('users').updateOne(
    { email: 'admin@zenius.ai' },
    { $set: { password: hash } }
  );
  console.log('Password hash updated manually for admin@zenius.ai', result.modifiedCount);
  process.exit(0);
}).catch(console.error);
