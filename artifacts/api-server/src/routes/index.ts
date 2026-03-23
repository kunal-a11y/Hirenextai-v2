import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import jobsRouter from "./jobs.js";
import applicationsRouter from "./applications.js";
import aiRouter from "./ai.js";
import profileRouter from "./profile.js";
import subscriptionRouter from "./subscription.js";
import resumeRouter from "./resume.js";
import recruiterRouter from "./recruiter.js";
import alertsRouter from "./alerts.js";
import savedJobsRouter from "./saved-jobs.js";
import dashboardRouter from "./dashboard.js";
import supportRouter from "./support.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/jobs", jobsRouter);
router.use("/applications", applicationsRouter);
router.use("/ai", aiRouter);
router.use("/profile", profileRouter);
router.use("/subscription", subscriptionRouter);
router.use("/resume", resumeRouter);
router.use("/recruiter", recruiterRouter);
router.use("/alerts", alertsRouter);
router.use("/saved-jobs", savedJobsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/support", supportRouter);
router.use("/admin", adminRouter);

export default router;
