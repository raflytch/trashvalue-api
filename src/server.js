import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import {
  errorHandler,
  notFoundHandler,
} from "../src/middlewares/error-handler.js";
import router from "./routes/index.js";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  const currentTime = new Date().toLocaleString();
  const serverUptime = process.uptime().toFixed(2) + " seconds";

  res.json({
    message: "Welcome to TrashValue API",
    version: "1.0.0",
    serverTime: currentTime,
    serverUptime: serverUptime,
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      base: "/api/v1",
      users: "/api/v1/users",
      wasteTypes: "/api/v1/waste-types",
      dropoffs: "/api/v1/dropoffs",
      waste: "/api/v1/waste",
      transactions: "/api/v1/transactions",
    },
    status: "operational",
  });
});

app.use("/api/v1", router);

app.use(errorHandler);
app.use(notFoundHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
