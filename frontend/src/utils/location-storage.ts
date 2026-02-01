// Location storage utility for managing selected location in localStorage

import type { ILocation } from "@shared/interfaces/location.interface";

const LOCATION_STORAGE_KEY = 'selected_location';

export interface IStoredLocation {
    id: string;
    name: string;
}


/**
 * Set selected location ID in localStorage
 */
export function setSelectedLocation(location: IStoredLocation | null): void {
    if (typeof window === 'undefined') return;
    if (location === null) {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
    } else {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    }
}

/**
 * Get selected location data from localStorage
 */
export function getSelectedLocation(): IStoredLocation | null {
    if (typeof window === 'undefined') return null;
    const locationData = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!locationData) return null;
    return JSON.parse(locationData) as ILocation;
}
