import { Request, Response, NextFunction } from 'express';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import config from '../config';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

// 1. Initialize the JWKS client pointing to your Supabase project's public keys
const client = jwksClient({
  jwksUri: `${config.supabase.url}/auth/v1/.well-known/jwks.json`,
  cache: true,         // Cache keys to prevent hitting rate limits
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// 2. Helper function to extract the key ID (kid) and get the public key
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('No kid found in JWT header'), undefined);
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error fetching signing key:', err.message);
      return callback(err, undefined);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

interface DecodedToken {
  sub: string;
  email: string;
  role?: string;
  aud: string;
}

/**
 * Middleware to require authentication via JWT token
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization header provided',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization header format. Expected: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided',
    });
    return;
  }

  // 3. Verify using the getKey callback instead of a hardcoded secret string
  jwt.verify(
    token,
    getKey,
    { algorithms: ['ES256', 'RS256', 'HS256'] },
    (err, decoded) => {
      if (err) {
        if (err instanceof jwt.TokenExpiredError) {
          return res.status(401).json({ error: 'Unauthorized', message: 'Token has expired' });
        }
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
      }

      const decodedToken = decoded as DecodedToken;

      if (decodedToken.aud !== 'authenticated') {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token audience' });
      }

      // Attach user info to request
      req.user = {
        id: decodedToken.sub,
        email: decodedToken.email,
        role: decodedToken.role,
      };

      next();
    }
  );
}

/**
 * Optional auth middleware - attaches user if token is present but doesn't require it
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return next();
  }

  const token = parts[1];
  if (!token) {
    return next();
  }

  jwt.verify(
    token,
    getKey,
    { algorithms: ['ES256', 'RS256', 'HS256'] },
    (err, decoded) => {
      if (!err && decoded) {
        const decodedToken = decoded as DecodedToken;
        if (decodedToken.aud === 'authenticated') {
          req.user = {
            id: decodedToken.sub,
            email: decodedToken.email,
            role: decodedToken.role,
          };
        }
      }
      next();
    }
  );
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
    return;
  }

  next();
}