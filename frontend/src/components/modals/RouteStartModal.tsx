import React from 'react';
import { useRouteStore } from '../../store/routeStore';
import { toast } from '../../store/toastStore';
import './Modal.css';

/**
 * 경로 시작 지점 선택 모달
 * - GPS로 자동 설정
 * - 지도에서 수동 선택
 */
export const RouteStartModal: React.FC = () => {
  const {
    isRouteModalOpen,
    setRouteModalOpen,
    setStartPosition,
    setStartPickMode,
  } = useRouteStore();

  if (!isRouteModalOpen) return null;

  // GPS로 현재 위치 설정
  const handleGPS = () => {
    setRouteModalOpen(false);

    if (!navigator.geolocation) {
      toast.error('GPS가 지원되지 않는 브라우저입니다');
      return;
    }

    toast.info('현재 위치를 가져오는 중...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStartPosition({ lat: latitude, lng: longitude });
        toast.success('출발지가 설정되었습니다');
      },
      (error) => {
        console.error('Geolocation error:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('위치 권한이 거부되었습니다');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('위치 정보를 사용할 수 없습니다');
            break;
          case error.TIMEOUT:
            toast.error('위치 요청 시간이 초과되었습니다');
            break;
          default:
            toast.error('위치를 가져올 수 없습니다');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 지도에서 수동 선택
  const handleManual = () => {
    setRouteModalOpen(false);
    setStartPickMode(true);
    toast.info('지도를 클릭하여 출발 지점을 선택하세요');
  };

  // 모달 닫기
  const handleClose = () => {
    setRouteModalOpen(false);
  };

  // 오버레이 클릭으로 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="route-modal" onClick={handleOverlayClick}>
      <div className="route-modal-overlay" />
      <div className="route-modal-content">
        <h3 className="route-modal-title">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          시작 지점을 선택하세요
        </h3>
        <p className="route-modal-desc">
          출발 위치를 설정하면 목적지까지의 경로를 확인할 수 있습니다
        </p>

        <div className="route-modal-buttons">
          {/* GPS 버튼 */}
          <button
            className="route-modal-btn route-modal-btn-primary"
            onClick={handleGPS}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <div>
              <div className="btn-title">내 위치 사용</div>
              <div className="btn-desc">GPS로 자동 설정</div>
            </div>
          </button>

          {/* 수동 선택 버튼 */}
          <button className="route-modal-btn" onClick={handleManual}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <div>
              <div className="btn-title">지도에서 선택</div>
              <div className="btn-desc">직접 클릭하여 지정</div>
            </div>
          </button>
        </div>

        {/* 닫기 버튼 */}
        <button className="route-modal-close" onClick={handleClose}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default RouteStartModal;
