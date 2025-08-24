import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { generateTravelItinerary, testGeminiAPI } from "./routes/gemini";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Gemini AI API routes
  app.post("/api/generate-itinerary", generateTravelItinerary);
  app.get("/api/test-gemini", testGeminiAPI);

  return app;
}
