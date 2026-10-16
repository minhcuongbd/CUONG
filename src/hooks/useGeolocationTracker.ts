import { useState, useEffect, useCallback } from 'react';
import { CompanyConfig } from '../types';

export type LocationSimulationMode = 'real' | 'sim_far' | 'sim_approaching' | 'sim_inside';

// Haversine formula to compute great-circle distance between two points in meters
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function useGeolocationTracker(company: CompanyConfig) {
  const [mode, setMode] = useState<LocationSimulationMode>('sim_approaching');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number>(110);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(true);

  // Update distance whenever coords or company changes
  const updateDistance = useCallback((lat: number, lng: number) => {
    const dist = calculateDistanceMeters(lat, lng, company.latitude, company.longitude);
    setDistance(dist);
    setIsInsideGeofence(dist <= company.radiusMeters);
  }, [company.latitude, company.longitude, company.radiusMeters]);

  // Real GPS tracking
  useEffect(() => {
    if (mode !== 'real') {
      // Mock coordinates based on simulation mode
      let lat = company.latitude;
      let lng = company.longitude;

      if (mode === 'sim_far') {
        // ~3.2km away
        lat = company.latitude + 0.025;
        lng = company.longitude + 0.015;
      } else if (mode === 'sim_approaching') {
        // ~110m away (near the gate / parking)
        lat = company.latitude + 0.0008;
        lng = company.longitude + 0.0005;
      } else if (mode === 'sim_inside') {
        // ~20m inside office
        lat = company.latitude + 0.0001;
        lng = company.longitude + 0.0001;
      }

      setCurrentCoords({ lat, lng });
      updateDistance(lat, lng);
      setGeoError(null);
      return;
    }

    if (!('geolocation' in navigator)) {
      setGeoError('Thiết bị không hỗ trợ định vị GPS');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        updateDistance(latitude, longitude);
        setGeoError(null);
      },
      (err) => {
        let message = 'Không thể lấy vị trí GPS';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Bạn chưa cấp quyền định vị GPS';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Tín hiệu GPS yếu';
        } else if (err.code === err.TIMEOUT) {
          message = 'Hết thời gian chờ định vị';
        }
        setGeoError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [mode, company, updateDistance]);

  const requestCurrentLocationAsCompany = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Trình duyệt không hỗ trợ Geolocation'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, []);

  return {
    mode,
    setMode,
    currentCoords,
    distance,
    isInsideGeofence,
    geoError,
    isTracking,
    setIsTracking,
    requestCurrentLocationAsCompany,
  };
}
