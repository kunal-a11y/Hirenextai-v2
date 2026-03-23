import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { startJobScheduler } from "./services/jobScheduler.js";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Start background job fetching scheduler
startJobScheduler();

export default app;
