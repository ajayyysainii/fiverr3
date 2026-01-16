import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./googleAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Check auth status without requiring auth
  app.get("/api/auth/status", (req: any, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json({ 
        authenticated: true, 
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profileImageUrl: req.user.profileImageUrl,
        }
      });
    } else {
      res.json({ authenticated: false });
    }
  });
}
