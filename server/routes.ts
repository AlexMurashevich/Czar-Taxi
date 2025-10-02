import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSeasonSchema, insertUserSchema, insertImportSchema } from "@shared/schema";
import { z } from "zod";
import { xlsxProcessor } from "./services/xlsx-processor";
import { calculations } from "./services/calculations";
import { roleTransitions } from "./services/role-transitions";
import { antiFraud } from "./services/anti-fraud";
import { telegramBot } from "./services/telegram-bot";
import { analyticsService } from "./services/analytics";
import { exportService } from "./services/export";
import { setupWebSocket } from "./websocket";
import multer from "multer";

const upload = multer({ dest: 'uploads/' });

// Admin authentication middleware (session-based)
const adminAuth = (req: any, res: any, next: any) => {
  // In development without ADMIN_KEY, allow all requests
  if (!process.env.ADMIN_KEY) {
    return next();
  }
  
  // Check if admin is authenticated via session
  if (req.session?.isAdmin) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { adminKey } = req.body || {};
      
      if (!process.env.ADMIN_KEY) {
        // In development without ADMIN_KEY, auto-login
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regenerate error:', err);
            return res.status(500).json({ error: "Login failed" });
          }
          req.session.isAdmin = true;
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ error: "Login failed" });
            }
            res.json({ success: true });
          });
        });
        return;
      }
      
      if (!adminKey) {
        return res.status(400).json({ error: 'Admin key required' });
      }
      
      if (adminKey === process.env.ADMIN_KEY) {
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regenerate error:', err);
            return res.status(500).json({ error: "Login failed" });
          }
          req.session.isAdmin = true;
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ error: "Login failed" });
            }
            res.json({ success: true });
          });
        });
        return;
      }
      
      return res.status(401).json({ error: 'Invalid admin key' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/status", async (req, res) => {
    res.json({ 
      isAdmin: req.session?.isAdmin || false,
      requiresAuth: !!process.env.ADMIN_KEY 
    });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", adminAuth, async (req, res) => {
    try {
      const fraudAlerts = await antiFraud.getActiveAlerts();
      const stats = await storage.getDashboardStats(fraudAlerts.length);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/hierarchy-stats/:seasonId", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      if (isNaN(seasonId) || seasonId <= 0) {
        return res.status(400).json({ error: "Invalid season ID - must be a positive integer" });
      }
      const stats = await storage.getHierarchyStats(seasonId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hierarchy stats" });
    }
  });

  app.get("/api/dashboard/waitlist-count", adminAuth, async (req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch waitlist count" });
    }
  });

  // Seasons
  app.get("/api/seasons", adminAuth, async (req, res) => {
    try {
      const seasons = await storage.getSeasons();
      res.json(seasons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seasons" });
    }
  });

  app.get("/api/seasons/active", adminAuth, async (req, res) => {
    try {
      const season = await storage.getActiveSeason();
      res.json(season);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active season" });
    }
  });

  app.post("/api/seasons", adminAuth, async (req, res) => {
    try {
      const seasonData = insertSeasonSchema.parse(req.body);
      const season = await storage.createSeason(seasonData);
      
      await storage.createAuditLog({
        actorId: null,
        action: 'CREATE_SEASON',
        entityType: 'season',
        entityId: season.id,
        payloadJson: JSON.stringify(seasonData)
      });

      res.status(201).json(season);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid season data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create season" });
    }
  });

  app.post("/api/seasons/:id/activate", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      
      // Deactivate all other seasons first
      const seasons = await storage.getSeasons();
      for (const season of seasons) {
        if (season.status === 'active') {
          await storage.updateSeason(season.id, { status: 'closed' });
        }
      }

      // Activate the target season
      const season = await storage.updateSeason(seasonId, { status: 'active' });
      
      await storage.createAuditLog({
        actorId: null,
        action: 'ACTIVATE_SEASON',
        entityType: 'season',
        entityId: seasonId,
        payloadJson: JSON.stringify({ seasonId })
      });

      res.json(season);
    } catch (error) {
      res.status(500).json({ error: "Failed to activate season" });
    }
  });

  app.post("/api/seasons/:id/close", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.id);
      
      // Apply role transitions
      await roleTransitions.applySeasonEndTransitions(seasonId);
      
      // Close the season
      const season = await storage.updateSeason(seasonId, { status: 'closed' });
      
      await storage.createAuditLog({
        actorId: null,
        action: 'CLOSE_SEASON',
        entityType: 'season',
        entityId: seasonId,
        payloadJson: JSON.stringify({ seasonId })
      });

      res.json(season);
    } catch (error) {
      res.status(500).json({ error: "Failed to close season" });
    }
  });

  // Imports
  app.get("/api/imports", adminAuth, async (req, res) => {
    try {
      const imports = await storage.getImports();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch imports" });
    }
  });

  app.post("/api/imports", adminAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const importRecord = await storage.createImport({
        fileName: req.file.originalname,
        uploadedBy: null,
        rowsCount: 0,
        status: 'processing'
      });

      // Process XLSX file
      try {
        const result = await xlsxProcessor.processFile(req.file.path, importRecord.id);
        
        await storage.updateImport(importRecord.id, {
          rowsCount: result.processedRows,
          status: result.errors.length > 0 ? 'partial' : 'processed',
          errorsJson: result.errors.length > 0 ? JSON.stringify(result.errors) : null
        });

        // Trigger recalculations
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason) {
          await calculations.recalculateAggregates(activeSeason.id);
        }

        res.json({ 
          success: true, 
          importId: importRecord.id,
          processedRows: result.processedRows,
          errors: result.errors 
        });
      } catch (processingError: any) {
        await storage.updateImport(importRecord.id, {
          status: 'failed',
          errorsJson: JSON.stringify([{ error: processingError.message }])
        });
        
        res.status(500).json({ error: "Failed to process file", details: processingError.message });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to handle import" });
    }
  });

  // Hierarchy
  app.get("/api/hierarchy/:seasonId", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const assignments = await storage.getRoleAssignmentsBySeasonId(seasonId);
      
      // Build hierarchy tree
      const hierarchy = await buildHierarchyTree(assignments);
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hierarchy" });
    }
  });

  // Leaderboards
  app.get("/api/leaderboards/centurions/:seasonId", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const limit = parseInt(req.query.limit as string) || 10;
      const centurions = await storage.getTopCenturions(seasonId, limit);
      res.json(centurions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch centurions leaderboard" });
    }
  });

  app.get("/api/leaderboards/drivers/:seasonId", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const limit = parseInt(req.query.limit as string) || 10;
      const drivers = await storage.getTopDrivers(seasonId, limit);
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers leaderboard" });
    }
  });

  // Participants
  app.get("/api/participants", adminAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.get("/api/waitlist", adminAuth, async (req, res) => {
    try {
      const waitlist = await storage.getWaitlist();
      res.json(waitlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch waitlist" });
    }
  });

  // Anti-fraud
  app.get("/api/fraud/alerts", adminAuth, async (req, res) => {
    try {
      const alerts = await antiFraud.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fraud alerts" });
    }
  });

  // Analytics
  app.get("/api/analytics/:seasonId", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      if (isNaN(seasonId) || seasonId <= 0) {
        return res.status(400).json({ error: "Invalid season ID - must be a positive integer" });
      }
      const data = await analyticsService.getAnalytics(seasonId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Export
  app.get("/api/export/season/:seasonId", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      const buffer = await exportService.exportSeasonSummary(seasonId);
      const season = await storage.getSeason(seasonId);
      const filename = `season_${season?.name || seasonId}_summary.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Export season error:', error);
      res.status(500).json({ error: "Failed to export season summary" });
    }
  });

  app.get("/api/export/leaderboard/:seasonId/:role", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const role = req.params.role;

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      if (!['sotnik', 'driver'].includes(role)) {
        return res.status(400).json({ error: "Invalid role - must be 'sotnik' or 'driver'" });
      }

      const buffer = await exportService.exportLeaderboard(seasonId, role);
      const season = await storage.getSeason(seasonId);
      const roleLabel = role === 'sotnik' ? 'centurions' : 'drivers';
      const filename = `leaderboard_${roleLabel}_${season?.name || seasonId}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Export leaderboard error:', error);
      res.status(500).json({ error: "Failed to export leaderboard" });
    }
  });

  app.get("/api/export/daily/:seasonId/:date", adminAuth, async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      const date = req.params.date;

      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }

      const buffer = await exportService.exportDailyReport(seasonId, date);
      const filename = `daily_report_${date}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Export daily report error:', error);
      res.status(500).json({ error: "Failed to export daily report" });
    }
  });

  app.get("/api/export/fraud-alerts", adminAuth, async (req, res) => {
    try {
      const buffer = await exportService.exportFraudAlerts();
      const filename = `fraud_alerts_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Export fraud alerts error:', error);
      res.status(500).json({ error: "Failed to export fraud alerts" });
    }
  });

  app.get("/api/export/user/:userId/season/:seasonId", adminAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const seasonId = parseInt(req.params.seasonId);

      if (isNaN(userId) || isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid user ID or season ID" });
      }

      const buffer = await exportService.exportUserPerformance(userId, seasonId);
      const user = await storage.getUser(userId);
      const filename = `user_${user?.phone || userId}_performance.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Export user performance error:', error);
      res.status(500).json({ error: "Failed to export user performance" });
    }
  });

  // Notifications
  app.get("/api/notifications", adminAuth, async (req, res) => {
    try {
      const { userId, type, status, limit } = req.query;
      const filters: any = {};
      if (userId) filters.userId = parseInt(userId as string);
      if (type) filters.type = type as string;
      if (status) filters.status = status as string;
      if (limit) filters.limit = parseInt(limit as string);
      
      const notifications = await storage.getNotifications(filters);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/preferences/:userId", adminAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const preferences = await storage.getNotificationPreferences(userId);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });

  app.put("/api/notifications/preferences/:id", adminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid preference ID" });
      }
      const updated = await storage.updateNotificationPreference(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification preference" });
    }
  });

  app.post("/api/notifications/send", adminAuth, async (req, res) => {
    try {
      const { userId, type, title, message, deliveryMethod } = req.body;
      
      if (!userId || !type || !title || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { notificationService } = await import("./services/notifications");
      await notificationService.sendNotification({
        userId: parseInt(userId),
        type,
        title,
        message,
        deliveryMethod: deliveryMethod || 'both',
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to send notification:', error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Recalculations
  app.post("/api/recalculate", adminAuth, async (req, res) => {
    try {
      const activeSeason = await storage.getActiveSeason();
      if (!activeSeason) {
        return res.status(400).json({ error: "No active season" });
      }

      await calculations.recalculateAggregates(activeSeason.id);
      
      await storage.createAuditLog({
        actorId: null,
        action: 'RECALCULATE_AGGREGATES',
        entityType: 'season',
        entityId: activeSeason.id,
        payloadJson: JSON.stringify({ seasonId: activeSeason.id })
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to recalculate aggregates" });
    }
  });

  // Group redistribution
  app.post("/api/redistribute", adminAuth, async (req, res) => {
    try {
      const activeSeason = await storage.getActiveSeason();
      if (!activeSeason) {
        return res.status(400).json({ error: "No active season" });
      }

      await roleTransitions.redistributeGroups(activeSeason.id);
      
      await storage.createAuditLog({
        actorId: null,
        action: 'REDISTRIBUTE_GROUPS',
        entityType: 'season',
        entityId: activeSeason.id,
        payloadJson: JSON.stringify({ seasonId: activeSeason.id })
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to redistribute groups" });
    }
  });

  // Telegram bot webhook
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      await telegramBot.handleUpdate(req.body);
      res.json({ ok: true });
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  return httpServer;
}

async function buildHierarchyTree(assignments: any[]) {
  // Build hierarchy tree from role assignments
  const tsarAssignment = assignments.find(a => a.role === 'tsar');
  if (!tsarAssignment) return null;

  const tsar = await storage.getUser(tsarAssignment.userId);
  const tsarStats = await storage.getAggregatesSeasonBySeasonId(tsarAssignment.seasonId)
    .then(aggregates => aggregates.find(a => a.userId === tsarAssignment.userId));

  const centurions = await Promise.all(
    assignments
      .filter(a => a.role === 'sotnik')
      .map(async (assignment) => {
        const user = await storage.getUser(assignment.userId);
        const stats = await storage.getAggregatesSeasonBySeasonId(assignment.seasonId)
          .then(aggregates => aggregates.find(a => a.userId === assignment.userId));
        
        const subordinates = assignments
          .filter(a => a.role === 'desyatnik' && a.sotnikId === assignment.userId)
          .length;

        return {
          assignment,
          user,
          stats,
          subordinates
        };
      })
  );

  return {
    tsar: {
      assignment: tsarAssignment,
      user: tsar,
      stats: tsarStats,
      centurions: centurions.slice(0, 10) // Show first 10
    }
  };
}
