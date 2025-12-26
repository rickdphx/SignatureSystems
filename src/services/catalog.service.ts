import { getCatalogServices } from '../clients/square';
import { parseDuration } from '../utils/helpers';
import logger from '../utils/logger';

export interface ServiceVariation {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // in cents
  version: bigint;
  itemName?: string;
}

/**
 * Get all service variations from Square catalog
 */
export async function getAllServiceVariations(): Promise<ServiceVariation[]> {
  logger.info('Fetching service variations from Square catalog');

  try {
    const items = await getCatalogServices();
    const variations: ServiceVariation[] = [];

    for (const item of items) {
      if (!item.itemData?.variations) continue;

      const itemName = item.itemData.name || 'Unknown Service';

      for (const variation of item.itemData.variations) {
        if (!variation.id || !variation.version) continue;

        const variationData = variation.itemVariationData;
        if (!variationData) continue;

        // Parse duration
        let duration = 30; // default 30 minutes
        if (variationData.serviceDuration) {
          duration = parseDuration(variationData.serviceDuration);
        }

        // Parse price
        let price = 0;
        if (variationData.priceMoney?.amount) {
          price = Number(variationData.priceMoney.amount);
        }

        const name = variationData.name || itemName;

        variations.push({
          id: variation.id,
          name,
          duration,
          price,
          version: variation.version,
          itemName,
        });
      }
    }

    logger.info(`Found ${variations.length} service variations`);
    return variations;
  } catch (error) {
    logger.error('Failed to fetch service variations', { error });
    throw error;
  }
}

/**
 * Get a specific service variation by ID
 */
export async function getServiceVariationById(
  variationId: string
): Promise<ServiceVariation | null> {
  const variations = await getAllServiceVariations();
  return variations.find((v) => v.id === variationId) || null;
}

/**
 * Get service variations for a specific barber
 */
export async function getBarberServiceVariations(
  barberId: string
): Promise<ServiceVariation[]> {
  const { getBarberServices } = await import('./barberService.service');

  const barberServices = await getBarberServices(barberId);

  if (barberServices.length === 0) {
    // If no services assigned, return all services (default behavior)
    logger.info(`No specific services assigned to barber ${barberId}, returning all services`);
    return getAllServiceVariations();
  }

  const allVariations = await getAllServiceVariations();
  const assignedVariationIds = new Set(
    barberServices.map((bs) => bs.serviceVariationId)
  );

  return allVariations.filter((v) => assignedVariationIds.has(v.id));
}
