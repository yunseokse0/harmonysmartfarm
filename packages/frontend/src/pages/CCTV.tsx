import { useEffect, useState } from 'react';
import './CCTV.css';

interface Camera {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline';
  streamUrl: string;
  thumbnailUrl?: string;
  lastUpdate?: string;
}

export default function CCTV() {
  const [cameras, setCameras] = useState<Camera[]>([
    {
      id: 1,
      name: '온실 1동 - 입구',
      location: '온실 1동',
      status: 'online',
      streamUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 2,
      name: '온실 1동 - 내부',
      location: '온실 1동',
      status: 'online',
      streamUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 3,
      name: '온실 2동 - 입구',
      location: '온실 2동',
      status: 'online',
      streamUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 4,
      name: '저장고 - 외부',
      location: '저장고',
      status: 'offline',
      streamUrl: '',
      lastUpdate: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(cameras[0] || null);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 주기적으로 카메라 상태 업데이트 (실제로는 API 호출)
    const interval = setInterval(() => {
      setCameras((prev) =>
        prev.map((cam) => ({
          ...cam,
          lastUpdate: new Date().toISOString(),
        }))
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleCameraSelect = (camera: Camera) => {
    setSelectedCamera(camera);
    setViewMode('single');
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="cctv-page">
      <div className="cctv-header">
        <h1>CCTV 모니터링</h1>
        <div className="cctv-controls">
          <button
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            그리드 뷰
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
            disabled={!selectedCamera}
          >
            단일 뷰
          </button>
        </div>
      </div>

      <div className="cctv-content">
        {viewMode === 'grid' ? (
          <div className="camera-grid">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className={`camera-card ${camera.status} ${selectedCamera?.id === camera.id ? 'selected' : ''}`}
                onClick={() => handleCameraSelect(camera)}
              >
                <div className="camera-header">
                  <span className="camera-name">{camera.name}</span>
                  <span className={`status-indicator ${camera.status}`}>
                    {camera.status === 'online' ? '●' : '○'}
                  </span>
                </div>
                <div className="camera-video-container">
                  {camera.status === 'online' ? (
                    <video
                      src={camera.streamUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="camera-video"
                    />
                  ) : (
                    <div className="camera-offline">
                      <p>카메라 오프라인</p>
                      <p className="offline-note">연결을 확인해주세요</p>
                    </div>
                  )}
                </div>
                <div className="camera-info">
                  <span className="camera-location">{camera.location}</span>
                  <span className="camera-time">{formatTime(camera.lastUpdate)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="camera-single-view">
            {selectedCamera ? (
              <>
                <div className="single-view-header">
                  <div>
                    <h2>{selectedCamera.name}</h2>
                    <div className="single-view-info">
                      <span className={`status-badge ${selectedCamera.status}`}>
                        {selectedCamera.status === 'online' ? '온라인' : '오프라인'}
                      </span>
                      <span>{selectedCamera.location}</span>
                      <span>마지막 업데이트: {formatTime(selectedCamera.lastUpdate)}</span>
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? '전체화면 해제' : '전체화면'}
                  </button>
                </div>
                <div className={`single-view-video-container ${isFullscreen ? 'fullscreen' : ''}`}>
                  {selectedCamera.status === 'online' ? (
                    <video
                      src={selectedCamera.streamUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="single-view-video"
                    />
                  ) : (
                    <div className="camera-offline-large">
                      <p>카메라 오프라인</p>
                      <p className="offline-note">연결을 확인해주세요</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-camera-selected">
                <p>카메라를 선택해주세요</p>
              </div>
            )}
          </div>
        )}

        <div className="camera-sidebar">
          <div className="camera-list">
            <h3>카메라 목록</h3>
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className={`camera-list-item ${selectedCamera?.id === camera.id ? 'selected' : ''} ${camera.status}`}
                onClick={() => handleCameraSelect(camera)}
              >
                <div className="camera-list-header">
                  <span className="camera-list-name">{camera.name}</span>
                  <span className={`status-dot ${camera.status}`}></span>
                </div>
                <div className="camera-list-info">
                  <span>{camera.location}</span>
                  <span className="camera-list-time">{formatTime(camera.lastUpdate)}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedCamera && (
            <div className="camera-details">
              <h3>카메라 상세 정보</h3>
              <div className="detail-item">
                <label>이름:</label>
                <span>{selectedCamera.name}</span>
              </div>
              <div className="detail-item">
                <label>위치:</label>
                <span>{selectedCamera.location}</span>
              </div>
              <div className="detail-item">
                <label>상태:</label>
                <span className={`status-badge ${selectedCamera.status}`}>
                  {selectedCamera.status === 'online' ? '온라인' : '오프라인'}
                </span>
              </div>
              <div className="detail-item">
                <label>마지막 업데이트:</label>
                <span>{formatTime(selectedCamera.lastUpdate)}</span>
              </div>
              <div className="detail-item">
                <label>스트림 URL:</label>
                <code className="stream-url">{selectedCamera.streamUrl || 'N/A'}</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

