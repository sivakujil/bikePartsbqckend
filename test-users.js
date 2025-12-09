import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/Models/User.js";

dotenv.config();

const testUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Has Password: ${!!user.passwordHash}`);
    });

    if (users.length === 0) {
      console.log("❌ No users found. You need to run the seed script first.");
      console.log("Run: node src/seed.js");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

testUsers();
