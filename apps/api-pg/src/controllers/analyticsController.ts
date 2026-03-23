import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDashboardMetrics();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

