import type { Request, Response, NextFunction } from 'express';
import type { UserRoleType } from '@shared/schema';

export function requireRole(allowedRoles: UserRoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role as UserRoleType)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

export function requireAdmin() {
  return requireRole(['admin']);
}

export function requireInstructorOrAdmin() {
  return requireRole(['instructor', 'admin']);
}

export function requireOwnershipOrRole(allowedRoles: UserRoleType[], getUserId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = getUserId(req);
    const isOwner = req.user.id === resourceUserId;
    const hasRole = allowedRoles.includes(req.user.role as UserRoleType);

    if (!isOwner && !hasRole) {
      return res.status(403).json({ 
        error: 'Access denied. Must be owner or have required role.',
        required: allowedRoles
      });
    }

    next();
  };
}
