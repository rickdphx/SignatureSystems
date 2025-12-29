import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import * as tradingService from '../services/trading.service';
import { schwabClient } from '../clients/schwab';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Validation middleware
 */
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/trading/accounts
 * Get all broker accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.brokerAccount.findMany({
      where: { isActive: true },
      include: {
        portfolios: {
          where: { isActive: true },
        },
      },
    });
    res.json(accounts);
  } catch (error) {
    logger.error('Failed to get broker accounts', { error });
    res.status(500).json({ error: 'Failed to get broker accounts' });
  }
});

/**
 * POST /api/trading/accounts
 * Create a new broker account
 */
router.post(
  '/accounts',
  [
    body('accountNumber').notEmpty(),
    body('accountType').isIn(['MARGIN', 'CASH', 'IRA']),
    body('brokerName').optional().isIn(['SCHWAB', 'TD_AMERITRADE', 'INTERACTIVE_BROKERS']),
    body('isPaperTrading').optional().isBoolean(),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const account = await prisma.brokerAccount.create({
        data: {
          accountNumber: req.body.accountNumber,
          accountType: req.body.accountType,
          brokerName: req.body.brokerName || 'SCHWAB',
          isPaperTrading: req.body.isPaperTrading !== undefined ? req.body.isPaperTrading : true,
        },
      });
      res.json(account);
    } catch (error) {
      logger.error('Failed to create broker account', { error });
      res.status(500).json({ error: 'Failed to create broker account' });
    }
  }
);

/**
 * POST /api/trading/accounts/:accountNumber/sync
 * Sync account data from broker
 */
router.post(
  '/accounts/:accountNumber/sync',
  [param('accountNumber').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const account = await tradingService.syncBrokerAccount(req.params.accountNumber);
      res.json(account);
    } catch (error) {
      logger.error('Failed to sync broker account', { error });
      res.status(500).json({ error: 'Failed to sync broker account' });
    }
  }
);

/**
 * POST /api/trading/accounts/:accountNumber/tokens
 * Set OAuth tokens for account
 */
router.post(
  '/accounts/:accountNumber/tokens',
  [
    param('accountNumber').notEmpty(),
    body('accessToken').notEmpty(),
    body('refreshToken').notEmpty(),
    body('expiresIn').isInt(),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const account = await prisma.brokerAccount.update({
        where: { accountNumber: req.params.accountNumber },
        data: {
          accessToken: req.body.accessToken,
          refreshToken: req.body.refreshToken,
          tokenExpiresAt: new Date(Date.now() + req.body.expiresIn * 1000),
        },
      });
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to set account tokens', { error });
      res.status(500).json({ error: 'Failed to set account tokens' });
    }
  }
);

/**
 * GET /api/trading/portfolios
 * Get all portfolios
 */
router.get('/portfolios', async (req: Request, res: Response) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { isActive: true },
      include: {
        brokerAccount: true,
        positions: true,
      },
    });
    res.json(portfolios);
  } catch (error) {
    logger.error('Failed to get portfolios', { error });
    res.status(500).json({ error: 'Failed to get portfolios' });
  }
});

/**
 * POST /api/trading/portfolios
 * Create a new portfolio
 */
router.post(
  '/portfolios',
  [
    body('name').notEmpty(),
    body('brokerAccountId').notEmpty(),
    body('initialCapital').isFloat({ min: 0 }),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const portfolio = await prisma.portfolio.create({
        data: {
          name: req.body.name,
          description: req.body.description,
          brokerAccountId: req.body.brokerAccountId,
          initialCapital: req.body.initialCapital,
          currentValue: req.body.initialCapital,
        },
      });
      res.json(portfolio);
    } catch (error) {
      logger.error('Failed to create portfolio', { error });
      res.status(500).json({ error: 'Failed to create portfolio' });
    }
  }
);

/**
 * GET /api/trading/portfolios/:portfolioId
 * Get portfolio summary with positions, trades, and signals
 */
router.get(
  '/portfolios/:portfolioId',
  [param('portfolioId').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const portfolio = await tradingService.getPortfolioSummary(req.params.portfolioId);
      res.json(portfolio);
    } catch (error) {
      logger.error('Failed to get portfolio summary', { error });
      res.status(500).json({ error: 'Failed to get portfolio summary' });
    }
  }
);

/**
 * POST /api/trading/portfolios/:portfolioId/sync
 * Sync positions and orders from broker
 */
router.post(
  '/portfolios/:portfolioId/sync',
  [param('portfolioId').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: req.params.portfolioId },
      });

      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      // Sync positions and orders
      await tradingService.syncPositions(portfolio.brokerAccountId, portfolio.id);
      await tradingService.syncOrders(portfolio.brokerAccountId);
      await tradingService.syncBrokerAccount(portfolio.brokerAccountId);

      // Get updated portfolio
      const updated = await tradingService.getPortfolioSummary(req.params.portfolioId);
      res.json(updated);
    } catch (error) {
      logger.error('Failed to sync portfolio', { error });
      res.status(500).json({ error: 'Failed to sync portfolio' });
    }
  }
);

/**
 * GET /api/trading/positions
 * Get all positions for a portfolio
 */
router.get(
  '/positions',
  [query('portfolioId').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const positions = await prisma.position.findMany({
        where: { portfolioId: req.query.portfolioId as string },
        orderBy: { marketValue: 'desc' },
      });
      res.json(positions);
    } catch (error) {
      logger.error('Failed to get positions', { error });
      res.status(500).json({ error: 'Failed to get positions' });
    }
  }
);

/**
 * GET /api/trading/orders
 * Get orders for a portfolio
 */
router.get(
  '/orders',
  [query('accountNumber').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const orders = await prisma.order.findMany({
        where: { brokerAccountId: req.query.accountNumber as string },
        orderBy: { placedAt: 'desc' },
        take: 50,
      });
      res.json(orders);
    } catch (error) {
      logger.error('Failed to get orders', { error });
      res.status(500).json({ error: 'Failed to get orders' });
    }
  }
);

/**
 * POST /api/trading/orders/market
 * Place a market order
 */
router.post(
  '/orders/market',
  [
    body('accountNumber').notEmpty(),
    body('portfolioId').notEmpty(),
    body('symbol').notEmpty(),
    body('quantity').isFloat({ min: 0.01 }),
    body('side').isIn(['BUY', 'SELL']),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const order = await tradingService.placeMarketOrder(
        req.body.accountNumber,
        req.body.portfolioId,
        req.body.symbol,
        req.body.quantity,
        req.body.side,
        req.body.strategy
      );
      res.json(order);
    } catch (error) {
      logger.error('Failed to place market order', { error });
      res.status(500).json({ error: 'Failed to place market order' });
    }
  }
);

/**
 * POST /api/trading/orders/limit
 * Place a limit order
 */
router.post(
  '/orders/limit',
  [
    body('accountNumber').notEmpty(),
    body('portfolioId').notEmpty(),
    body('symbol').notEmpty(),
    body('quantity').isFloat({ min: 0.01 }),
    body('price').isFloat({ min: 0.01 }),
    body('side').isIn(['BUY', 'SELL']),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const order = await tradingService.placeLimitOrder(
        req.body.accountNumber,
        req.body.portfolioId,
        req.body.symbol,
        req.body.quantity,
        req.body.price,
        req.body.side,
        req.body.strategy
      );
      res.json(order);
    } catch (error) {
      logger.error('Failed to place limit order', { error });
      res.status(500).json({ error: 'Failed to place limit order' });
    }
  }
);

/**
 * DELETE /api/trading/orders/:orderId
 * Cancel an order
 */
router.delete(
  '/orders/:orderId',
  [param('orderId').notEmpty(), query('accountNumber').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const order = await tradingService.cancelOrder(
        req.query.accountNumber as string,
        req.params.orderId
      );
      res.json(order);
    } catch (error) {
      logger.error('Failed to cancel order', { error });
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }
);

/**
 * GET /api/trading/trades
 * Get trade history for a portfolio
 */
router.get(
  '/trades',
  [query('portfolioId').optional(), validate],
  async (req: Request, res: Response) => {
    try {
      const trades = await prisma.trade.findMany({
        where: req.query.portfolioId
          ? { portfolioId: req.query.portfolioId as string }
          : undefined,
        orderBy: { executedAt: 'desc' },
        take: 100,
      });
      res.json(trades);
    } catch (error) {
      logger.error('Failed to get trades', { error });
      res.status(500).json({ error: 'Failed to get trades' });
    }
  }
);

/**
 * GET /api/trading/market-data/:symbol
 * Get market data for a symbol
 */
router.get(
  '/market-data/:symbol',
  [param('symbol').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      let marketData = await prisma.marketData.findUnique({
        where: { symbol: req.params.symbol },
      });

      // If data is stale (>1 minute), update it
      if (!marketData || Date.now() - marketData.lastUpdatedAt.getTime() > 60000) {
        await tradingService.updateMarketData([req.params.symbol]);
        marketData = await prisma.marketData.findUnique({
          where: { symbol: req.params.symbol },
        });
      }

      res.json(marketData);
    } catch (error) {
      logger.error('Failed to get market data', { error });
      res.status(500).json({ error: 'Failed to get market data' });
    }
  }
);

/**
 * POST /api/trading/market-data/refresh
 * Refresh market data for multiple symbols
 */
router.post(
  '/market-data/refresh',
  [body('symbols').isArray(), validate],
  async (req: Request, res: Response) => {
    try {
      const data = await tradingService.updateMarketData(req.body.symbols);
      res.json(data);
    } catch (error) {
      logger.error('Failed to refresh market data', { error });
      res.status(500).json({ error: 'Failed to refresh market data' });
    }
  }
);

/**
 * GET /api/trading/auth/url
 * Get Schwab OAuth authorization URL
 */
router.get('/auth/url', async (req: Request, res: Response) => {
  try {
    const url = schwabClient.getAuthorizationUrl();
    res.json({ url });
  } catch (error) {
    logger.error('Failed to get authorization URL', { error });
    res.status(500).json({ error: 'Failed to get authorization URL' });
  }
});

/**
 * POST /api/trading/auth/callback
 * Handle OAuth callback and exchange code for tokens
 */
router.post(
  '/auth/callback',
  [body('code').notEmpty(), body('accountNumber').notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const tokens = await schwabClient.getTokensFromCode(req.body.code);

      // Update account with tokens
      await prisma.brokerAccount.update({
        where: { accountNumber: req.body.accountNumber },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        },
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to handle OAuth callback', { error });
      res.status(500).json({ error: 'Failed to handle OAuth callback' });
    }
  }
);

export default router;
