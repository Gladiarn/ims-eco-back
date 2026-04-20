import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/userServices";

const userService = new UserService();

// This would normally come from environment variables
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    // In a real Supabase setup, the token is a JWT signed with a secret
    // If no secret is provided, we might be in development mode or using the Supabase client to verify
    
    let decoded: any;
    
    if (SUPABASE_JWT_SECRET) {
      try {
        decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
    } else {
      // FALLBACK for development if secret is missing: 
      // Try to decode without verification or use a mock if in development
      if (process.env.NODE_ENV === 'development') {
         decoded = jwt.decode(token);
         console.warn("⚠️ AUTH: Verifying token without secret in development mode");
      } else {
         return res.status(500).json({ success: false, message: "Auth configuration missing" });
      }
    }

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    // The 'sub' field in Supabase JWT is the user's UUID
    const supabaseUid = decoded.sub;
    
    // Get user from our database
    let user = await userService.getUserBySupabaseUid(supabaseUid);
    
    if (!user) {
      // If user exists in Supabase but not in our DB, we might want to sync them
      // For now, return unauthorized or trigger a sync if possible
      return res.status(403).json({ success: false, message: "User not registered in IMS" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "User account is inactive" });
    }

    // Attach user to request object
    // @ts-ignore
    req.user = user;
    
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
};

/**
 * Middleware to check user roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;
    
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    
    next();
  };
};
