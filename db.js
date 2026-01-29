import mongoose from "mongoose";
reuire("dotenv").config();

const mongoURl =
  process.env.MONGODB_URI || "mongodb://localhost:27017/mydatabase";

//dont add @ in password

const mongoURlLive = process.env.MONGODB_URI_LIVE || mongoURl;

export async function connectToDatabase() {
  try {
    await mongoose.connect(mongoURl);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

console.log("Connecting to MongoDB...");

const db = mongoose.connection;

db.on("connected", () => {
  console.log("MongoDB connected");
});

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connection is open");
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

export default db;
// Connect to the database when this module is imported
connectToDatabase();
