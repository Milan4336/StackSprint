"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
const geolocation_1 = require("../utils/geolocation");
const isPrivateIp = (ip) => {
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')
        return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.'))
        return true;
    if (ip.startsWith('172.')) {
        const second = Number(ip.split('.')[1]);
        if (Number.isFinite(second) && second >= 16 && second <= 31) {
            return true;
        }
    }
    return false;
};
const asNumber = (value) => {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};
const normalizeGeo = (value) => {
    const latitude = asNumber(value.latitude);
    const longitude = asNumber(value.longitude);
    const city = typeof value.city === 'string' && value.city.trim().length > 0 ? value.city.trim() : undefined;
    const country = typeof value.country === 'string' && value.country.trim().length > 0 ? value.country.trim() : undefined;
    return { latitude, longitude, city, country };
};
class GeoService {
    cacheTtl = env_1.env.GEO_CACHE_TTL_SECONDS;
    async getCache(key) {
        const raw = await redis_1.redisClient.get(key);
        if (!raw)
            return null;
        try {
            return normalizeGeo(JSON.parse(raw));
        }
        catch {
            return null;
        }
    }
    async setCache(key, value) {
        await redis_1.redisClient.set(key, JSON.stringify(value), 'EX', this.cacheTtl);
    }
    locationFallback(location) {
        const mapped = (0, geolocation_1.geocodeLocation)(location);
        if (!mapped)
            return {};
        return {
            latitude: mapped.latitude,
            longitude: mapped.longitude,
            city: mapped.city,
            country: mapped.country
        };
    }
    async resolveByIp(ipAddress) {
        if (isPrivateIp(ipAddress)) {
            return null;
        }
        const cacheKey = `geo:ip:${ipAddress}`;
        const cached = await this.getCache(cacheKey);
        if (cached)
            return cached;
        try {
            const response = await axios_1.default.get(`${env_1.env.GEOIP_API_URL}/${ipAddress}`, {
                timeout: 1500
            });
            if (response.data?.success === false) {
                return null;
            }
            const resolved = normalizeGeo({
                latitude: response.data?.latitude,
                longitude: response.data?.longitude,
                country: response.data?.country,
                city: response.data?.city
            });
            if (typeof resolved.latitude === 'number' && typeof resolved.longitude === 'number') {
                await this.setCache(cacheKey, resolved);
                return resolved;
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async resolveCoordinates(ipAddress, location) {
        const ipResolved = await this.resolveByIp(ipAddress);
        if (ipResolved) {
            return ipResolved;
        }
        const locationKey = `geo:location:${location.trim().toLowerCase()}`;
        const locationCached = await this.getCache(locationKey);
        if (locationCached) {
            return locationCached;
        }
        const fallback = this.locationFallback(location);
        if (typeof fallback.latitude === 'number' && typeof fallback.longitude === 'number') {
            await this.setCache(locationKey, fallback);
        }
        return fallback;
    }
}
exports.GeoService = GeoService;
