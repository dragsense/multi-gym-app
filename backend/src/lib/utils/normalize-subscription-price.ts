import { ESubscriptionFrequency } from '@shared/enums';

/**
 * Returns the normalized subscription price after applying frequency and discount.
 */
export function normalizeSubscriptionPrice(
    basePrice: number,
    frequency: ESubscriptionFrequency,
    discountPercentage?: number,
): number {
    let price = basePrice;

    switch (frequency) {
        case ESubscriptionFrequency.WEEKLY:
            price = basePrice / 4; // assume 4 weeks per month
            break;
        case ESubscriptionFrequency.YEARLY:
            price = basePrice * 12; // yearly
            break;
        case ESubscriptionFrequency.MONTHLY:
        default:
            break;
    }

    if (discountPercentage && discountPercentage > 0) {
        price = price * (1 - discountPercentage / 100);
    }

    return price;
}
