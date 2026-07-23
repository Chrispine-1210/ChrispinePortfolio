import { Router } from "express";
import { analytics } from "./analytics.js";

export function setupAnalyticsRoutes(router: Router) {
  // Get current analytics stats
  router.get("/api/analytics/stats", (req, res) => {
    try {
      const stats = analytics.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get recent events
  router.get("/api/analytics/events", (req, res) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const events = analytics.getEvents({ hours }).slice(-50); // Last 50 events
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Get events by type
  router.get("/api/analytics/events/type/:type", (req, res) => {
    try {
      const { type } = req.params;
      const events = analytics.getEvents({ type });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
}
