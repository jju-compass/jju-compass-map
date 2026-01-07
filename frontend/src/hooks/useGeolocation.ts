import { useCallback } from 'react';
import { useMapStore } from '../store';
import type { Coordinates } from '../types';

export function useGeolocation() {
  const { setCurrentLocation, setCenter, setError } = useMapStore();

  const getCurrentLocation = useCallback(() => {
    return new Promise<Coordinates>((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = '이 브라우저에서는 위치 서비스를 지원하지 않습니다';
        setError(error);
        reject(new Error(error));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          let message = '위치를 가져올 수 없습니다';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = '위치 권한이 거부되었습니다';
              break;
            case error.POSITION_UNAVAILABLE:
              message = '위치 정보를 사용할 수 없습니다';
              break;
            case error.TIMEOUT:
              message = '위치 요청 시간이 초과되었습니다';
              break;
          }
          setError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [setCurrentLocation, setError]);

  const moveToCurrentLocation = useCallback(async () => {
    try {
      const location = await getCurrentLocation();
      setCenter(location);
      return location;
    } catch (error) {
      throw error;
    }
  }, [getCurrentLocation, setCenter]);

  return {
    getCurrentLocation,
    moveToCurrentLocation,
  };
}

export default useGeolocation;
