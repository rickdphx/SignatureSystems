import { PrismaClient } from '@prisma/client';
import { schwabClient, SchwabOrder, SchwabQuote } from '../clients/schwab';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Sync broker account data from Schwab
 */
export async function syncBrokerAccount(accountNumber: string) {
  try {
    // Initialize Schwab client with stored tokens
    await schwabClient.initializeWithAccount(accountNumber);

    // Get account details from Schwab
    const schwabAccount = await schwabClient.getAccount(accountNumber, true);
    const balances = schwabAccount.securitiesAccount.currentBalances;

    // Update account in database
    const account = await prisma.brokerAccount.update({
      where: { accountNumber },
      data: {
        accountValue: balances.liquidationValue || 0,
        cashBalance: balances.cashBalance || 0,
        buyingPower: balances.buyingPower || 0,
        lastSyncedAt: new Date(),
      },
    });

    logger.info('Broker account synced successfully', { accountNumber });
    return account;
  } catch (error) {
    logger.error('Failed to sync broker account', { error, accountNumber });
    throw error;
  }
}

/**
 * Sync positions from Schwab to database
 */
export async function syncPositions(accountNumber: string, portfolioId: string) {
  try {
    await schwabClient.initializeWithAccount(accountNumber);
    const schwabPositions = await schwabClient.getPositions(accountNumber);

    const positions = [];

    for (const pos of schwabPositions) {
      const quantity = pos.longQuantity - pos.shortQuantity;
      const side = quantity >= 0 ? 'LONG' : 'SHORT';

      const position = await prisma.position.upsert({
        where: {
          portfolioId_symbol: {
            portfolioId,
            symbol: pos.instrument.symbol,
          },
        },
        update: {
          quantity: Math.abs(quantity),
          averagePrice: quantity >= 0 ? pos.averageLongPrice : pos.averageShortPrice,
          currentPrice: pos.marketValue / Math.abs(quantity),
          marketValue: pos.marketValue,
          unrealizedPnL: pos.longOpenProfitLoss + pos.shortOpenProfitLoss,
          unrealizedPnLPercent: ((pos.longOpenProfitLoss + pos.shortOpenProfitLoss) / pos.marketValue) * 100,
          side,
          lastUpdatedAt: new Date(),
        },
        create: {
          portfolioId,
          brokerAccountId: accountNumber,
          symbol: pos.instrument.symbol,
          assetType: pos.instrument.assetType,
          quantity: Math.abs(quantity),
          averagePrice: quantity >= 0 ? pos.averageLongPrice : pos.averageShortPrice,
          currentPrice: pos.marketValue / Math.abs(quantity),
          marketValue: pos.marketValue,
          costBasis: quantity >= 0 ? pos.averageLongPrice * Math.abs(quantity) : pos.averageShortPrice * Math.abs(quantity),
          unrealizedPnL: pos.longOpenProfitLoss + pos.shortOpenProfitLoss,
          unrealizedPnLPercent: ((pos.longOpenProfitLoss + pos.shortOpenProfitLoss) / pos.marketValue) * 100,
          side,
          openedAt: new Date(), // This should ideally come from trade history
        },
      });

      positions.push(position);
    }

    logger.info('Positions synced successfully', { accountNumber, count: positions.length });
    return positions;
  } catch (error) {
    logger.error('Failed to sync positions', { error, accountNumber });
    throw error;
  }
}

/**
 * Sync orders from Schwab to database
 */
export async function syncOrders(accountNumber: string) {
  try {
    await schwabClient.initializeWithAccount(accountNumber);
    const schwabOrders = await schwabClient.getOrders(accountNumber);

    const orders = [];

    for (const order of schwabOrders) {
      if (!order.orderId) continue;

      const leg = order.orderLegCollection[0];

      const dbOrder = await prisma.order.upsert({
        where: { brokerOrderId: order.orderId },
        update: {
          status: order.status || 'PENDING',
          filledQuantity: order.filledQuantity || 0,
          averageFillPrice: order.filledQuantity && order.filledQuantity > 0 ? (order.price || 0) : undefined,
          filledAt: order.status === 'FILLED' ? new Date(order.closeTime || Date.now()) : undefined,
          cancelledAt: order.status === 'CANCELED' ? new Date(order.closeTime || Date.now()) : undefined,
          updatedAt: new Date(),
        },
        create: {
          brokerAccountId: accountNumber,
          brokerOrderId: order.orderId,
          symbol: leg.instrument.symbol,
          assetType: leg.instrument.assetType,
          side: leg.instruction.includes('BUY') ? 'BUY' : 'SELL',
          orderType: order.orderType,
          timeInForce: order.duration,
          quantity: order.quantity,
          filledQuantity: order.filledQuantity || 0,
          limitPrice: order.price,
          stopPrice: order.stopPrice,
          status: order.status || 'PENDING',
          placedAt: new Date(order.enteredTime || Date.now()),
          filledAt: order.status === 'FILLED' ? new Date(order.closeTime || Date.now()) : undefined,
        },
      });

      orders.push(dbOrder);
    }

    logger.info('Orders synced successfully', { accountNumber, count: orders.length });
    return orders;
  } catch (error) {
    logger.error('Failed to sync orders', { error, accountNumber });
    throw error;
  }
}

/**
 * Place a market order
 */
export async function placeMarketOrder(
  accountNumber: string,
  portfolioId: string,
  symbol: string,
  quantity: number,
  side: 'BUY' | 'SELL',
  strategy?: string
) {
  try {
    await schwabClient.initializeWithAccount(accountNumber);

    // Create order object
    const order = schwabClient.createMarketOrder(symbol, quantity, side);

    // Place order with Schwab
    const schwabResponse = await schwabClient.placeOrder(accountNumber, order);

    // Get quote for current price
    const quote = await schwabClient.getQuote(symbol);

    // Save order to database
    const dbOrder = await prisma.order.create({
      data: {
        brokerAccountId: accountNumber,
        symbol,
        assetType: 'STOCK',
        side,
        orderType: 'MARKET',
        timeInForce: 'DAY',
        quantity,
        status: 'WORKING',
        strategy,
        placedAt: new Date(),
        metadata: schwabResponse,
      },
    });

    logger.info('Market order placed successfully', { accountNumber, symbol, quantity, side });
    return dbOrder;
  } catch (error) {
    logger.error('Failed to place market order', { error, accountNumber, symbol, quantity, side });
    throw error;
  }
}

/**
 * Place a limit order
 */
export async function placeLimitOrder(
  accountNumber: string,
  portfolioId: string,
  symbol: string,
  quantity: number,
  price: number,
  side: 'BUY' | 'SELL',
  strategy?: string
) {
  try {
    await schwabClient.initializeWithAccount(accountNumber);

    // Create order object
    const order = schwabClient.createLimitOrder(symbol, quantity, price, side);

    // Place order with Schwab
    const schwabResponse = await schwabClient.placeOrder(accountNumber, order);

    // Save order to database
    const dbOrder = await prisma.order.create({
      data: {
        brokerAccountId: accountNumber,
        symbol,
        assetType: 'STOCK',
        side,
        orderType: 'LIMIT',
        timeInForce: 'DAY',
        quantity,
        limitPrice: price,
        status: 'WORKING',
        strategy,
        placedAt: new Date(),
        metadata: schwabResponse,
      },
    });

    logger.info('Limit order placed successfully', { accountNumber, symbol, quantity, price, side });
    return dbOrder;
  } catch (error) {
    logger.error('Failed to place limit order', { error, accountNumber, symbol, quantity, price, side });
    throw error;
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(accountNumber: string, orderId: string) {
  try {
    await schwabClient.initializeWithAccount(accountNumber);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.brokerOrderId) {
      throw new Error('Order not found or missing broker order ID');
    }

    // Cancel with Schwab
    await schwabClient.cancelOrder(accountNumber, order.brokerOrderId);

    // Update database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    logger.info('Order cancelled successfully', { accountNumber, orderId });
    return updatedOrder;
  } catch (error) {
    logger.error('Failed to cancel order', { error, accountNumber, orderId });
    throw error;
  }
}

/**
 * Update market data for symbols
 */
export async function updateMarketData(symbols: string[]) {
  try {
    const quotes = await schwabClient.getQuotes(symbols);

    const marketDataUpdates = [];

    for (const [symbol, quote] of Object.entries(quotes)) {
      const data = await prisma.marketData.upsert({
        where: { symbol },
        update: {
          lastPrice: quote.lastPrice,
          bidPrice: quote.bidPrice,
          askPrice: quote.askPrice,
          volume: quote.totalVolume,
          open: quote.openPrice,
          high: quote.highPrice,
          low: quote.lowPrice,
          previousClose: quote.closePrice,
          change: quote.netChange,
          changePercent: (quote.netChange / quote.closePrice) * 100,
          week52High: quote['52WkHigh'],
          week52Low: quote['52WkLow'],
          pe: quote.peRatio,
          dividendYield: quote.divYield,
          lastUpdatedAt: new Date(),
        },
        create: {
          symbol,
          assetType: quote.assetMainType,
          lastPrice: quote.lastPrice,
          bidPrice: quote.bidPrice,
          askPrice: quote.askPrice,
          volume: quote.totalVolume,
          open: quote.openPrice,
          high: quote.highPrice,
          low: quote.lowPrice,
          previousClose: quote.closePrice,
          change: quote.netChange,
          changePercent: (quote.netChange / quote.closePrice) * 100,
          week52High: quote['52WkHigh'],
          week52Low: quote['52WkLow'],
          pe: quote.peRatio,
          dividendYield: quote.divYield,
          lastUpdatedAt: new Date(),
        },
      });

      marketDataUpdates.push(data);
    }

    logger.info('Market data updated successfully', { symbolCount: symbols.length });
    return marketDataUpdates;
  } catch (error) {
    logger.error('Failed to update market data', { error, symbols });
    throw error;
  }
}

/**
 * Calculate portfolio metrics
 */
export async function calculatePortfolioMetrics(portfolioId: string) {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: true,
        trades: {
          orderBy: { executedAt: 'asc' },
        },
      },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Calculate current value
    const currentValue = portfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0);

    // Calculate total PnL
    const totalPnL = currentValue - portfolio.initialCapital;
    const totalPnLPercent = (totalPnL / portfolio.initialCapital) * 100;

    // Calculate win/loss metrics
    const closingTrades = portfolio.trades.filter(t => t.realizedPnL !== null);
    const winningTrades = closingTrades.filter(t => (t.realizedPnL || 0) > 0);
    const losingTrades = closingTrades.filter(t => (t.realizedPnL || 0) < 0);

    const winRate = closingTrades.length > 0
      ? (winningTrades.length / closingTrades.length) * 100
      : 0;

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : undefined;

    // Calculate max drawdown
    let peak = portfolio.initialCapital;
    let maxDrawdown = 0;
    let runningValue = portfolio.initialCapital;

    for (const trade of portfolio.trades) {
      if (trade.realizedPnL) {
        runningValue += trade.realizedPnL;
      }

      if (runningValue > peak) {
        peak = runningValue;
      }

      const drawdown = ((peak - runningValue) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Update portfolio
    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        currentValue,
        totalPnL,
        totalPnLPercent,
        profitFactor,
        winRate,
        maxDrawdown: maxDrawdown || 0,
        totalTrades: closingTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        updatedAt: new Date(),
      },
    });

    logger.info('Portfolio metrics calculated successfully', { portfolioId });
    return updatedPortfolio;
  } catch (error) {
    logger.error('Failed to calculate portfolio metrics', { error, portfolioId });
    throw error;
  }
}

/**
 * Get portfolio summary
 */
export async function getPortfolioSummary(portfolioId: string) {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        brokerAccount: true,
        positions: {
          include: {
            trades: {
              orderBy: { executedAt: 'desc' },
              take: 5,
            },
          },
        },
        trades: {
          orderBy: { executedAt: 'desc' },
          take: 10,
        },
        signals: {
          where: { isActedOn: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Get unique symbols from positions
    const symbols = portfolio.positions.map(p => p.symbol);

    // Update market data for all symbols
    if (symbols.length > 0) {
      await updateMarketData(symbols);
    }

    // Recalculate metrics
    await calculatePortfolioMetrics(portfolioId);

    // Get updated portfolio
    const updated = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        brokerAccount: true,
        positions: true,
        trades: {
          orderBy: { executedAt: 'desc' },
          take: 10,
        },
        signals: {
          where: { isActedOn: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return updated;
  } catch (error) {
    logger.error('Failed to get portfolio summary', { error, portfolioId });
    throw error;
  }
}
