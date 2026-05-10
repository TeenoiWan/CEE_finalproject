const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("MongoDB URI from env:", uri ? "Present" : "Missing");
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    
    // Log intent to connect (helps see where it hangs)
    console.log("Attempting to connect to MongoDB...");
    
    const conn = await mongoose.connect(uri, {
      family: 4, 
      retryWrites: true,
      serverSelectionTimeoutMS: 30000, // Increased timeout for better stability
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error Details:");
    console.error(`- Name: ${error.name}`);
    console.error(`- Message: ${error.message}`);
    if (error.code) console.error(`- Code: ${error.code}`);
    if (error.reason) console.error(`- Reason: ${error.reason}`);
    
    process.exit(1);
  }
};

module.exports = connectDB;
