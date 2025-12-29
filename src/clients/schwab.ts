import axios, { AxiosInstance, AxiosError } from 'axios';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Schwab API Client for paper trading
 *
 * API Documentation: https://developer.schwab.com/
 *
 * Environment Variables Required:
 * - SCHWAB_CLIENT_ID: Your Schwab app client ID
 * - SCHWAB_CLIENT_SECRET: Your Schwab app client secret
 * - SCHWAB_REDIRECT_URI: OAuth redirect URI
 * - SCHWAB_ENVIRONMENT: 'paper' or 'production'
 */

interface SchwabConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'paper' | 'production';
}

interface SchwabTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface SchwabAccount {
  accountNumber: string;
  accountType: string;
  roundTrips: number;
  isDayTrader: boolean;
  isClosingOnlyRestricted: boolean;
  currentBalances: {
    liquidationValue: number;
    cashBalance: number;
    longMarketValue: number;
    shortMarketValue: number;
    equity: number;
    buyingPower: number;
    marginBalance: number;
  };
  initialBalances?: {
    accountValue: number;
    cashBalance: number;
  };
}

interface SchwabPosition {
  shortQuantity: number;
  averagePrice: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  longQuantity: number;
  settledLongQuantity: number;
  settledShortQuantity: number;
  instrument: {
    assetType: string;
    cusip: string;
    symbol: string;
    description?: string;
  };
  marketValue: number;
  maintenanceRequirement: number;
  averageLongPrice: number;
  averageShortPrice: number;
  taxLotAverageLongPrice: number;
  taxLotAverageShortPrice: number;
  longOpenProfitLoss: number;
  shortOpenProfitLoss: number;
  previousSessionLongQuantity: number;
  previousSessionShortQuantity: number;
  currentDayCost: number;
}

interface SchwabOrder {
  session: 'NORMAL' | 'AM' | 'PM' | 'SEAMLESS';
  duration: 'DAY' | 'GOOD_TILL_CANCEL' | 'FILL_OR_KILL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'TRAILING_STOP';
  complexOrderStrategyType?: 'NONE' | 'COVERED' | 'VERTICAL' | 'BACK_RATIO' | 'CALENDAR' | 'DIAGONAL' | 'STRADDLE' | 'STRANGLE' | 'COLLAR_SYNTHETIC' | 'BUTTERFLY' | 'CONDOR' | 'IRON_CONDOR' | 'VERTICAL_ROLL' | 'COLLAR_WITH_STOCK' | 'DOUBLE_DIAGONAL' | 'UNBALANCED_BUTTERFLY' | 'UNBALANCED_CONDOR' | 'UNBALANCED_IRON_CONDOR' | 'UNBALANCED_VERTICAL_ROLL' | 'CUSTOM';
  quantity: number;
  filledQuantity?: number;
  remainingQuantity?: number;
  requestedDestination?: 'INET' | 'ECN_ARCA' | 'CBOE' | 'AMEX' | 'PHLX' | 'ISE' | 'BOX' | 'NYSE' | 'NASDAQ' | 'BATS' | 'C2' | 'AUTO';
  destinationLinkName?: string;
  price?: number;
  stopPrice?: number;
  orderLegCollection: Array<{
    orderLegType: 'EQUITY' | 'OPTION' | 'INDEX' | 'MUTUAL_FUND' | 'CASH_EQUIVALENT' | 'FIXED_INCOME' | 'CURRENCY';
    legId?: number;
    instrument: {
      assetType: string;
      cusip?: string;
      symbol: string;
      description?: string;
    };
    instruction: 'BUY' | 'SELL' | 'BUY_TO_COVER' | 'SELL_SHORT' | 'BUY_TO_OPEN' | 'BUY_TO_CLOSE' | 'SELL_TO_OPEN' | 'SELL_TO_CLOSE' | 'EXCHANGE';
    positionEffect?: 'OPENING' | 'CLOSING' | 'AUTOMATIC';
    quantity: number;
  }>;
  orderStrategyType: 'SINGLE' | 'OCO' | 'TRIGGER';
  orderId?: string;
  cancelable?: boolean;
  editable?: boolean;
  status?: 'AWAITING_PARENT_ORDER' | 'AWAITING_CONDITION' | 'AWAITING_MANUAL_REVIEW' | 'ACCEPTED' | 'AWAITING_UR_OUT' | 'PENDING_ACTIVATION' | 'QUEUED' | 'WORKING' | 'REJECTED' | 'PENDING_CANCEL' | 'CANCELED' | 'PENDING_REPLACE' | 'REPLACED' | 'FILLED' | 'EXPIRED';
  enteredTime?: string;
  closeTime?: string;
  accountNumber?: string;
}

interface SchwabQuote {
  assetMainType: string;
  assetSubType?: string;
  symbol: string;
  description?: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  lastPrice: number;
  lastSize: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  netChange: number;
  totalVolume: number;
  quoteTime: number;
  tradeTime: number;
  mark: number;
  exchange: string;
  exchangeName: string;
  marginable: boolean;
  shortable: boolean;
  volatility: number;
  digits: number;
  '52WkHigh': number;
  '52WkLow': number;
  peRatio: number;
  divAmount: number;
  divYield: number;
  divDate: string;
  securityStatus: string;
  regularMarketLastPrice: number;
  regularMarketLastSize: number;
  regularMarketNetChange: number;
  regularMarketTradeTime: number;
}

class SchwabClient {
  private axiosInstance: AxiosInstance;
  private config: SchwabConfig;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiresAt?: Date;

  constructor() {
    this.config = {
      clientId: process.env.SCHWAB_CLIENT_ID || '',
      clientSecret: process.env.SCHWAB_CLIENT_SECRET || '',
      redirectUri: process.env.SCHWAB_REDIRECT_URI || 'https://127.0.0.1',
      environment: (process.env.SCHWAB_ENVIRONMENT as 'paper' | 'production') || 'paper',
    };

    const baseURL = this.config.environment === 'production'
      ? 'https://api.schwab.com/v1'
      : 'https://api.schwab.com/v1'; // Schwab uses same endpoint, auth determines paper vs live

    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.refreshAccessToken();
          // Retry the original request
          if (error.config) {
            return this.axiosInstance.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize with tokens from database
   */
  async initializeWithAccount(accountNumber: string) {
    const account = await prisma.brokerAccount.findUnique({
      where: { accountNumber },
    });

    if (account?.accessToken && account?.refreshToken) {
      this.accessToken = account.accessToken;
      this.refreshToken = account.refreshToken;
      this.tokenExpiresAt = account.tokenExpiresAt || undefined;
    }
  }

  /**
   * Set tokens manually
   */
  setTokens(tokens: SchwabTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
  }

  /**
   * Ensure token is valid, refresh if needed
   */
  private async ensureValidToken() {
    if (!this.accessToken || !this.tokenExpiresAt) {
      throw new Error('Schwab client not authenticated. Please set tokens first.');
    }

    // Refresh if token expires in less than 5 minutes
    if (this.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'api',
    });

    return `https://api.schwab.com/v1/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(authCode: string): Promise<SchwabTokens> {
    try {
      const response = await axios.post(
        'https://api.schwab.com/v1/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: this.config.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${this.config.clientId}:${this.config.clientSecret}`
            ).toString('base64')}`,
          },
        }
      );

      const tokens: SchwabTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };

      this.setTokens(tokens);
      return tokens;
    } catch (error) {
      logger.error('Failed to get Schwab tokens from code', { error });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        'https://api.schwab.com/v1/oauth/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${this.config.clientId}:${this.config.clientSecret}`
            ).toString('base64')}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      logger.info('Schwab access token refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh Schwab access token', { error });
      throw error;
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<SchwabAccount[]> {
    try {
      const response = await this.axiosInstance.get('/accounts');
      return response.data;
    } catch (error) {
      logger.error('Failed to get Schwab accounts', { error });
      throw error;
    }
  }

  /**
   * Get specific account details with positions and orders
   */
  async getAccount(accountNumber: string, includePositions = true): Promise<any> {
    try {
      const fields = includePositions ? 'positions' : '';
      const response = await this.axiosInstance.get(
        `/accounts/${accountNumber}`,
        { params: { fields } }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get Schwab account details', { error, accountNumber });
      throw error;
    }
  }

  /**
   * Get positions for an account
   */
  async getPositions(accountNumber: string): Promise<SchwabPosition[]> {
    try {
      const account = await this.getAccount(accountNumber, true);
      return account.securitiesAccount?.positions || [];
    } catch (error) {
      logger.error('Failed to get Schwab positions', { error, accountNumber });
      throw error;
    }
  }

  /**
   * Get orders for an account
   */
  async getOrders(accountNumber: string, params?: {
    fromEnteredTime?: string;
    toEnteredTime?: string;
    status?: string;
  }): Promise<SchwabOrder[]> {
    try {
      const response = await this.axiosInstance.get(
        `/accounts/${accountNumber}/orders`,
        { params }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get Schwab orders', { error, accountNumber });
      throw error;
    }
  }

  /**
   * Place an order
   */
  async placeOrder(accountNumber: string, order: SchwabOrder): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `/accounts/${accountNumber}/orders`,
        order
      );
      logger.info('Schwab order placed successfully', { accountNumber, order });
      return response.data;
    } catch (error) {
      logger.error('Failed to place Schwab order', { error, accountNumber, order });
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(accountNumber: string, orderId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(
        `/accounts/${accountNumber}/orders/${orderId}`
      );
      logger.info('Schwab order cancelled successfully', { accountNumber, orderId });
    } catch (error) {
      logger.error('Failed to cancel Schwab order', { error, accountNumber, orderId });
      throw error;
    }
  }

  /**
   * Get quote for a symbol
   */
  async getQuote(symbol: string): Promise<SchwabQuote> {
    try {
      const response = await this.axiosInstance.get(`/marketdata/quotes`, {
        params: { symbols: symbol },
      });
      return response.data[symbol];
    } catch (error) {
      logger.error('Failed to get Schwab quote', { error, symbol });
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   */
  async getQuotes(symbols: string[]): Promise<Record<string, SchwabQuote>> {
    try {
      const response = await this.axiosInstance.get(`/marketdata/quotes`, {
        params: { symbols: symbols.join(',') },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get Schwab quotes', { error, symbols });
      throw error;
    }
  }

  /**
   * Get price history for a symbol
   */
  async getPriceHistory(symbol: string, params?: {
    periodType?: 'day' | 'month' | 'year' | 'ytd';
    period?: number;
    frequencyType?: 'minute' | 'daily' | 'weekly' | 'monthly';
    frequency?: number;
    startDate?: number;
    endDate?: number;
    needExtendedHoursData?: boolean;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/marketdata/${symbol}/pricehistory`,
        { params }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get Schwab price history', { error, symbol });
      throw error;
    }
  }

  /**
   * Create a market order
   */
  createMarketOrder(
    symbol: string,
    quantity: number,
    instruction: 'BUY' | 'SELL'
  ): SchwabOrder {
    return {
      orderType: 'MARKET',
      session: 'NORMAL',
      duration: 'DAY',
      orderStrategyType: 'SINGLE',
      quantity,
      orderLegCollection: [
        {
          instruction,
          quantity,
          instrument: {
            symbol,
            assetType: 'EQUITY',
          },
          orderLegType: 'EQUITY',
        },
      ],
    };
  }

  /**
   * Create a limit order
   */
  createLimitOrder(
    symbol: string,
    quantity: number,
    price: number,
    instruction: 'BUY' | 'SELL'
  ): SchwabOrder {
    return {
      orderType: 'LIMIT',
      session: 'NORMAL',
      duration: 'DAY',
      orderStrategyType: 'SINGLE',
      price,
      quantity,
      orderLegCollection: [
        {
          instruction,
          quantity,
          instrument: {
            symbol,
            assetType: 'EQUITY',
          },
          orderLegType: 'EQUITY',
        },
      ],
    };
  }
}

// Export singleton instance
export const schwabClient = new SchwabClient();

// Export types
export type {
  SchwabConfig,
  SchwabTokens,
  SchwabAccount,
  SchwabPosition,
  SchwabOrder,
  SchwabQuote,
};
