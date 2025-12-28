import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "YouTube Clone API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      videos: "/api/videos",
      channels: "/api/channels",
    },
    documentation: "Check README for API documentation",
  });
});

export default router;
