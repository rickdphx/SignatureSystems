import { Router, Request, Response, NextFunction } from 'express';
import { getTeamMembers } from '../clients/square';

const router = Router();

/**
 * GET /square/team-members
 * Get all active Square team members
 */
router.get('/team-members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamMembers = await getTeamMembers();

    res.json({
      success: true,
      count: teamMembers.length,
      teamMembers: teamMembers.map((tm) => ({
        id: tm.id,
        givenName: tm.givenName,
        familyName: tm.familyName,
        emailAddress: tm.emailAddress,
        phoneNumber: tm.phoneNumber,
        status: tm.status,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
