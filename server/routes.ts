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
import multer from "multer";

const upload = multer({ dest: 'uploads/' });

// Admin authentication middleware
const adminAuth = (req: any, res: any, next: any) => {
  // In development without ADMIN_KEY, allow all requests
  if (!process.env.ADMIN_KEY) {
    return next();
  }
  
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", adminAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
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
