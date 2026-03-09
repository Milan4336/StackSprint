import { logger } from '../config/logger';

export interface GeoLocation {
    latitude: number;
    longitude: number;
    country: string;
    city: string;
    accuracy: number;
}

export class GeoFraudService {
    /**
     * Mock IP to Geo resolution.
     * In a real environment, this would call MaxMind or ipinfo.io
     */
    async resolveIp(ip: string): Promise<GeoLocation> {
        // Deterministic random mapping for demo purposes
        const hash = this.stringToHash(ip);

        // Some common locations for a realistic map
        const locations = [
            { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
            { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
            { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
            { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
            { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
            { city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
            { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
            { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
            { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
            { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
        ];

        const loc = locations[Math.abs(hash) % locations.length];

        return {
            latitude: loc.lat + (Math.random() - 0.5) * 5, // Add jitter for realism
            longitude: loc.lng + (Math.random() - 0.5) * 5,
            country: loc.country,
            city: loc.city,
            accuracy: 0.95
        };
    }

    /**
     * Detects impossible travel between two points.
     * Logic: If speed > 1000 km/h, it's suspicious.
     */
    calculateTravelAnomaly(
        prevLoc: { lat: number, lng: number, time: Date },
        currLoc: { lat: number, lng: number, time: Date }
    ): boolean {
        const distance = this.getHaversineDistance(
            prevLoc.lat, prevLoc.lng,
            currLoc.lat, currLoc.lng
        );
        const timeDiffHours = (currLoc.time.getTime() - prevLoc.time.getTime()) / (1000 * 60 * 60);

        if (timeDiffHours <= 0) return false;

        const speed = distance / timeDiffHours;
        return speed > 1200; // Suspect if speed > 1200 km/h
    }

    private getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private stringToHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash;
    }
}
