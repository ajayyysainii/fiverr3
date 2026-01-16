import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || profile.displayName?.split(" ")[0];
          const lastName = profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ");
          const profileImageUrl = profile.photos?.[0]?.value;

          // Upsert user in database
          const user = await authStorage.upsertUser({
            id: profile.id,
            email: email || null,
            firstName: firstName || null,
            lastName: lastName || null,
            profileImageUrl: profileImageUrl || null,
          });

          // Add session info
          const sessionUser = {
            ...user,
            accessToken,
            refreshToken,
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          };

          return done(null, sessionUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      expires_at: user.expires_at,
    });
  });

  // Deserialize user from session
  passport.deserializeUser((sessionUser: any, done) => {
    done(null, sessionUser);
  });

  // Google OAuth login route
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })
  );

  // Google OAuth callback route
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth?error=authentication_failed",
    }),
    (req, res) => {
      // Successful authentication
      res.redirect("/");
    }
  );

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.redirect("/");
      });
    });
  });

  // Legacy login route for backwards compatibility (redirects to Google)
  app.get("/api/login", (req, res) => {
    res.redirect("/api/auth/google");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Development mode bypass
  if (process.env.NODE_ENV === "development") {
    if (!req.user) {
      req.user = {
        id: "dev-user",
        email: "REEDGLOBALEQUITYTRUST@GMAIL.COM",
        firstName: "Dev",
        lastName: "User",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if session is expired (optional - sessions are managed by passport)
  const now = Math.floor(Date.now() / 1000);
  if (user.expires_at && now > user.expires_at) {
    // Session expired, user needs to re-authenticate
    return res.status(401).json({ message: "Session expired. Please login again." });
  }

  return next();
};
