import { useEffect, useState, useRef } from 'react';
import './BIMViewer.css';

interface Sensor {
  id: number;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  facilityId: number;
  status: 'normal' | 'warning' | 'danger';
  value?: number;
  unit?: string;
}

interface Actuator {
  id: number;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  facilityId: number;
  status: 'on' | 'off';
}

interface Facility {
  id: number;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth?: number };
  sensors: Sensor[];
  actuators: Actuator[];
  status: 'normal' | 'warning' | 'danger';
}

export default function BIMViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'section'>('2d');
  const [bimImageLoaded, setBimImageLoaded] = useState(false);
  const [bimImageUrl, setBimImageUrl] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([
    {
      id: 1,
      name: '온실 1동',
      type: 'greenhouse',
      position: { x: 200, y: 0, z: 200 },
      size: { width: 300, height: 400 },
      sensors: [
        { id: 1, name: '온도 센서 1', type: 'temperature', position: { x: 250, y: 0, z: 300 }, facilityId: 1, status: 'normal', value: 24.5, unit: '°C' },
        { id: 2, name: '습도 센서 1', type: 'humidity', position: { x: 350, y: 0, z: 300 }, facilityId: 1, status: 'normal', value: 65, unit: '%' },
        { id: 3, name: 'CO2 센서 1', type: 'co2', position: { x: 300, y: 0, z: 400 }, facilityId: 1, status: 'normal', value: 450, unit: 'ppm' },
      ],
      actuators: [
        { id: 1, name: '환기팬 1', type: 'fan', position: { x: 200, y: 0, z: 250 }, facilityId: 1, status: 'off' },
        { id: 2, name: '관수 밸브 1', type: 'valve', position: { x: 400, y: 0, z: 350 }, facilityId: 1, status: 'on' },
      ],
      status: 'normal',
    },
    {
      id: 2,
      name: '온실 2동',
      type: 'greenhouse',
      position: { x: 550, y: 0, z: 200 },
      size: { width: 300, height: 400 },
      sensors: [
        { id: 4, name: '온도 센서 2', type: 'temperature', position: { x: 600, y: 0, z: 300 }, facilityId: 2, status: 'warning', value: 32.5, unit: '°C' },
        { id: 5, name: '습도 센서 2', type: 'humidity', position: { x: 700, y: 0, z: 300 }, facilityId: 2, status: 'normal', value: 58, unit: '%' },
      ],
      actuators: [
        { id: 3, name: '환기팬 2', type: 'fan', position: { x: 550, y: 0, z: 250 }, facilityId: 2, status: 'on' },
        { id: 4, name: '차광막', type: 'shade', position: { x: 800, y: 0, z: 350 }, facilityId: 2, status: 'on' },
      ],
      status: 'warning',
    },
    {
      id: 3,
      name: '저장고',
      type: 'storage',
      position: { x: 900, y: 0, z: 300 },
      size: { width: 200, height: 200 },
      sensors: [
        { id: 6, name: '온도 센서 3', type: 'temperature', position: { x: 1000, y: 0, z: 400 }, facilityId: 3, status: 'normal', value: 18, unit: '°C' },
      ],
      actuators: [
        { id: 5, name: '냉동기', type: 'cooler', position: { x: 950, y: 0, z: 350 }, facilityId: 3, status: 'off' },
      ],
      status: 'normal',
    },
  ]);

  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedActuator, setSelectedActuator] = useState<Actuator | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{ type: 'sensor' | 'actuator'; id: number } | null>(null);

  useEffect(() => {
    // 로컬 스토리지에서 저장된 BIM 이미지 URL 확인
    const savedImageUrl = localStorage.getItem('bim_image_url');
    if (savedImageUrl) {
      setBimImageUrl(savedImageUrl);
      loadBimImage(savedImageUrl);
    } else {
      // 기본 스마트팜 시설 평면도 이미지 생성
      generateDefaultBimImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBimImage = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      imageRef.current = img;
      setBimImageLoaded(true);
    };
    img.onerror = () => {
      setBimImageLoaded(false);
    };
  };

  const generateDefaultBimImage = () => {
    // 기본 스마트팜 시설 평면도를 Canvas로 생성
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 (더 세밀하게)
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 25) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // 축선 (더 진하게)
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 축선 라벨
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', canvas.width / 2, 15);
    ctx.fillText('S', canvas.width / 2, canvas.height - 5);
    ctx.fillText('W', 5, canvas.height / 2);
    ctx.fillText('E', canvas.width - 5, canvas.height / 2);

    // 통로/도로 (먼저 그리기)
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(500, 0, 50, canvas.height);
    ctx.fillRect(850, 200, 50, 400);
    
    // 도로 표시선
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.moveTo(525, 0);
    ctx.lineTo(525, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 온실 1동 (왼쪽) - 더 상세하게
    ctx.fillStyle = '#d5f4e6';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 4;
    ctx.fillRect(200, 200, 300, 400);
    ctx.strokeRect(200, 200, 300, 400);
    
    // 벽 두께 표시
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(200, 200, 300, 10); // 상단 벽
    ctx.fillRect(200, 590, 300, 10); // 하단 벽
    ctx.fillRect(200, 200, 10, 400); // 좌측 벽
    ctx.fillRect(490, 200, 10, 400); // 우측 벽
    
    // 입구
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(320, 200, 60, 10);
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.strokeRect(320, 200, 60, 10);
    
    // 내부 구역 구분선
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(220, 220, 260, 360);
    ctx.setLineDash([]);
    
    // 시설물 이름
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('온실 1동', 350, 240);

    // 온실 2동 (중앙) - 더 상세하게
    ctx.fillStyle = '#fef5e7';
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 4;
    ctx.fillRect(550, 200, 300, 400);
    ctx.strokeRect(550, 200, 300, 400);
    
    // 벽
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(550, 200, 300, 10);
    ctx.fillRect(550, 590, 300, 10);
    ctx.fillRect(550, 200, 10, 400);
    ctx.fillRect(840, 200, 10, 400);
    
    // 입구
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(670, 200, 60, 10);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.strokeRect(670, 200, 60, 10);
    
    // 내부 구역
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(570, 220, 260, 360);
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('온실 2동', 700, 240);

    // 저장고 (오른쪽) - 더 상세하게
    ctx.fillStyle = '#e8f8f5';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 4;
    ctx.fillRect(900, 300, 200, 200);
    ctx.strokeRect(900, 300, 200, 200);
    
    // 벽
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(900, 300, 200, 10);
    ctx.fillRect(900, 490, 200, 10);
    ctx.fillRect(900, 300, 10, 200);
    ctx.fillRect(1090, 300, 10, 200);
    
    // 입구
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(950, 300, 100, 10);
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 300, 100, 10);
    
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('저장고', 1000, 330);

    // 범례 (더 상세하게)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30, 30, 200, 120);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 200, 120);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('범례', 50, 55);
    
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(50, 70, 15, 15);
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('정상', 75, 82);
    
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(50, 95, 15, 15);
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('경고', 75, 107);
    
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(57, 125, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('센서', 75, 130);
    
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(57, 142, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('액추에이터', 75, 147);

    // 이미지로 변환
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setBimImageUrl(url);
        loadBimImage(url);
      }
    }, 'image/png');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setBimImageUrl(url);
      localStorage.setItem('bim_image_url', url);
      loadBimImage(url);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    // 2D BIM 뷰어 렌더링
    const canvas = canvasRef.current;
    if (!canvas || viewMode === '3d') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // BIM 배경 이미지 그리기
      if (imageRef.current && bimImageLoaded) {
        const img = imageRef.current;
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      } else if (!bimImageLoaded) {
        // 기본 그리드 그리기 (이미지 로딩 중일 때)
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 50) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 50) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }
        
        // 로딩 메시지
        ctx.fillStyle = '#95a5a6';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BIM 도면 로딩 중...', canvas.width / 2, canvas.height / 2);
      }

      // 시설물 오버레이 및 센서/액추에이터 위치 표시
      facilities.forEach((facility) => {
        const facilityX = facility.position.x;
        const facilityY = facility.position.z;
        const facilityWidth = facility.size.width;
        const facilityHeight = facility.size.height;

        // 선택된 시설물 강조
        if (selectedFacility?.id === facility.id) {
          ctx.strokeStyle = '#3498db';
          ctx.lineWidth = 5;
          ctx.shadowColor = '#3498db';
          ctx.shadowBlur = 20;
          ctx.strokeRect(facilityX, facilityY, facilityWidth, facilityHeight);
          ctx.shadowBlur = 0;
        }

        // 센서 위치 표시
        facility.sensors.forEach((sensor) => {
          const sensorX = sensor.position.x;
          const sensorY = sensor.position.z;
          const isHovered = hoveredItem?.type === 'sensor' && hoveredItem.id === sensor.id;
          const isSelected = selectedSensor?.id === sensor.id;

          // 센서 마커 (파란색 원)
          ctx.fillStyle = sensor.status === 'normal' ? '#3498db' : sensor.status === 'warning' ? '#f39c12' : '#e74c3c';
          ctx.beginPath();
          ctx.arc(sensorX, sensorY, isHovered || isSelected ? 10 : 8, 0, Math.PI * 2);
          ctx.fill();
          
          // 선택/호버 시 테두리
          if (isHovered || isSelected) {
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          
          // 센서 아이콘 (원형 안테나/신호 모양)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          // 외부 원
          ctx.beginPath();
          ctx.arc(sensorX, sensorY, 6, 0, Math.PI * 2);
          ctx.stroke();
          // 내부 점
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sensorX, sensorY, 2, 0, Math.PI * 2);
          ctx.fill();
          // 신호 파형 (위쪽)
          ctx.beginPath();
          ctx.moveTo(sensorX - 4, sensorY - 8);
          ctx.lineTo(sensorX, sensorY - 12);
          ctx.lineTo(sensorX + 4, sensorY - 8);
          ctx.stroke();

          // 센서 이름 및 값 (호버/선택 시)
          if (isHovered || isSelected) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(sensorX - 60, sensorY - 35, 120, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(sensor.name, sensorX, sensorY - 20);
            if (sensor.value !== undefined) {
              ctx.font = '10px sans-serif';
              ctx.fillText(`${sensor.value}${sensor.unit || ''}`, sensorX, sensorY - 8);
            }
          }
        });

        // 액추에이터 위치 표시
        facility.actuators.forEach((actuator) => {
          const actuatorX = actuator.position.x;
          const actuatorY = actuator.position.z;
          const isHovered = hoveredItem?.type === 'actuator' && hoveredItem.id === actuator.id;
          const isSelected = selectedActuator?.id === actuator.id;

          // 액추에이터 마커 (녹색 사각형)
          ctx.fillStyle = actuator.status === 'on' ? '#27ae60' : '#95a5a6';
          ctx.fillRect(actuatorX - 6, actuatorY - 6, 12, 12);
          
          // 선택/호버 시 테두리
          if (isHovered || isSelected) {
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.strokeRect(actuatorX - 7, actuatorY - 7, 14, 14);
          }
          
          // 액추에이터 아이콘 (기어 모양)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(actuatorX, actuatorY, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(actuatorX - 4, actuatorY);
          ctx.lineTo(actuatorX + 4, actuatorY);
          ctx.moveTo(actuatorX, actuatorY - 4);
          ctx.lineTo(actuatorX, actuatorY + 4);
          ctx.stroke();

          // 액추에이터 이름 (호버/선택 시)
          if (isHovered || isSelected) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(actuatorX - 50, actuatorY - 25, 100, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(actuator.name, actuatorX, actuatorY - 10);
            ctx.font = '10px sans-serif';
            ctx.fillText(actuator.status === 'on' ? 'ON' : 'OFF', actuatorX, actuatorY + 2);
          }
        });
      });
    };

    draw();

    // 마우스 이벤트
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let found = false;
      
      // 센서/액추에이터 호버 체크
      facilities.forEach((facility) => {
        facility.sensors.forEach((sensor) => {
          const distance = Math.sqrt(
            Math.pow(x - sensor.position.x, 2) + Math.pow(y - sensor.position.z, 2)
          );
          if (distance <= 12) {
            setHoveredItem({ type: 'sensor', id: sensor.id });
            canvas.style.cursor = 'pointer';
            found = true;
          }
        });

        facility.actuators.forEach((actuator) => {
          const distance = Math.sqrt(
            Math.pow(x - actuator.position.x, 2) + Math.pow(y - actuator.position.z, 2)
          );
          if (distance <= 12) {
            setHoveredItem({ type: 'actuator', id: actuator.id });
            canvas.style.cursor = 'pointer';
            found = true;
          }
        });
      });

      if (!found) {
        setHoveredItem(null);
        canvas.style.cursor = 'crosshair';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let clicked = false;

      // 센서 클릭 체크
      facilities.forEach((facility) => {
        facility.sensors.forEach((sensor) => {
          const distance = Math.sqrt(
            Math.pow(x - sensor.position.x, 2) + Math.pow(y - sensor.position.z, 2)
          );
          if (distance <= 12) {
            setSelectedSensor(sensor);
            setSelectedActuator(null);
            setSelectedFacility(facility);
            clicked = true;
          }
        });

        facility.actuators.forEach((actuator) => {
          const distance = Math.sqrt(
            Math.pow(x - actuator.position.x, 2) + Math.pow(y - actuator.position.z, 2)
          );
          if (distance <= 12) {
            setSelectedActuator(actuator);
            setSelectedSensor(null);
            setSelectedFacility(facility);
            clicked = true;
          }
        });

        // 시설물 클릭 체크
        if (!clicked) {
          const fx = facility.position.x;
          const fy = facility.position.z;
          const fw = facility.size.width;
          const fh = facility.size.height;

          if (x >= fx && x <= fx + fw && y >= fy && y <= fy + fh) {
            setSelectedFacility(facility);
            setSelectedSensor(null);
            setSelectedActuator(null);
          }
        }
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [facilities, selectedFacility, selectedSensor, selectedActuator, hoveredItem, viewMode, bimImageLoaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className="bim-viewer-page">
      <div className="bim-header">
        <h1>BIM 시설 모니터링</h1>
        <div className="bim-header-controls">
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === '3d' ? 'active' : ''}`}
              onClick={() => setViewMode('3d')}
            >
              3D 뷰
            </button>
            <button
              className={`view-btn ${viewMode === '2d' ? 'active' : ''}`}
              onClick={() => setViewMode('2d')}
            >
              2D 평면도
            </button>
            <button
              className={`view-btn ${viewMode === 'section' ? 'active' : ''}`}
              onClick={() => setViewMode('section')}
            >
              단면도
            </button>
          </div>
          <div className="bim-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              BIM 이미지 업로드
            </button>
            {bimImageUrl && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setBimImageUrl(null);
                  localStorage.removeItem('bim_image_url');
                  generateDefaultBimImage();
                }}
              >
                기본 도면으로
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bim-content">
        <div className="bim-canvas-container">
          {viewMode === '3d' ? (
            <div className="bim-3d-viewer">
              <div className="bim-3d-placeholder">
                <div className="bim-3d-icon">📐</div>
                <p>3D BIM 뷰어</p>
                <p className="placeholder-note">
                  Three.js 또는 다른 3D 라이브러리를 사용하여 실제 3D 모델을 표시할 수 있습니다.
                </p>
                <div className="bim-3d-info">
                  <p>• 3D 모델 파일 형식: glTF, OBJ, FBX</p>
                  <p>• 시설물 3D 모델을 업로드하여 표시 가능</p>
                  <p>• 마우스로 회전, 확대/축소, 이동 가능</p>
                </div>
              </div>
            </div>
          ) : (
            <canvas ref={canvasRef} className="bim-canvas" />
          )}
          {viewMode === '2d' && !bimImageLoaded && (
            <div className="bim-loading-overlay">
              <p>BIM 이미지 로딩 중...</p>
            </div>
          )}
        </div>

        <div className="bim-sidebar">
          <div className="facility-list">
            <h3>시설 목록</h3>
            {facilities.map((facility) => (
              <div
                key={facility.id}
                className={`facility-item ${selectedFacility?.id === facility.id ? 'selected' : ''} ${facility.status}`}
                onClick={() => setSelectedFacility(facility)}
              >
                <div className="facility-header">
                  <span className="facility-name">{facility.name}</span>
                  <span className={`status-badge ${facility.status}`}>
                    {facility.status === 'normal' ? '정상' : facility.status === 'warning' ? '경고' : '위험'}
                  </span>
                </div>
                <div className="facility-info">
                  <span>유형: {facility.type === 'greenhouse' ? '온실' : '저장고'}</span>
                  <span>센서: {facility.sensors.length}개</span>
                  <span>액추에이터: {facility.actuators.length}개</span>
                </div>
              </div>
            ))}
          </div>

          {(selectedSensor || selectedActuator) && (
            <div className="facility-details">
              <h3>{selectedSensor ? '센서 상세 정보' : '액추에이터 상세 정보'}</h3>
              <div className="detail-section">
                {selectedSensor && (
                  <>
                    <h4>{selectedSensor.name}</h4>
                    <div className="detail-item">
                      <label>유형:</label>
                      <span>{selectedSensor.type}</span>
                    </div>
                    <div className="detail-item">
                      <label>상태:</label>
                      <span className={`status-badge ${selectedSensor.status}`}>
                        {selectedSensor.status === 'normal' ? '정상' : selectedSensor.status === 'warning' ? '경고' : '위험'}
                      </span>
                    </div>
                    {selectedSensor.value !== undefined && (
                      <div className="detail-item">
                        <label>현재 값:</label>
                        <span className="sensor-value">
                          {selectedSensor.value}{selectedSensor.unit || ''}
                        </span>
                      </div>
                    )}
                    <div className="detail-item">
                      <label>위치:</label>
                      <span>
                        X: {selectedSensor.position.x}, Y: {selectedSensor.position.y}, Z: {selectedSensor.position.z}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>소속 시설:</label>
                      <span>
                        {facilities.find((f) => f.id === selectedSensor.facilityId)?.name || '알 수 없음'}
                      </span>
                    </div>
                  </>
                )}
                {selectedActuator && (
                  <>
                    <h4>{selectedActuator.name}</h4>
                    <div className="detail-item">
                      <label>유형:</label>
                      <span>{selectedActuator.type}</span>
                    </div>
                    <div className="detail-item">
                      <label>상태:</label>
                      <span className={`status-badge ${selectedActuator.status}`}>
                        {selectedActuator.status === 'on' ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>위치:</label>
                      <span>
                        X: {selectedActuator.position.x}, Y: {selectedActuator.position.y}, Z: {selectedActuator.position.z}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>소속 시설:</label>
                      <span>
                        {facilities.find((f) => f.id === selectedActuator.facilityId)?.name || '알 수 없음'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {selectedFacility && !selectedSensor && !selectedActuator && (
            <div className="facility-details">
              <h3>시설 상세 정보</h3>
              <div className="detail-section">
                <h4>{selectedFacility.name}</h4>
                <div className="detail-item">
                  <label>유형:</label>
                  <span>{selectedFacility.type === 'greenhouse' ? '온실' : '저장고'}</span>
                </div>
                <div className="detail-item">
                  <label>위치:</label>
                  <span>
                    X: {selectedFacility.position.x}, Y: {selectedFacility.position.y}, Z: {selectedFacility.position.z}
                  </span>
                </div>
                <div className="detail-item">
                  <label>상태:</label>
                  <span className={`status-badge ${selectedFacility.status}`}>
                    {selectedFacility.status === 'normal' ? '정상' : selectedFacility.status === 'warning' ? '경고' : '위험'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>연결된 센서 ({selectedFacility.sensors.length}개):</label>
                  <div className="sensor-list">
                    {selectedFacility.sensors.map((sensor) => (
                      <div
                        key={sensor.id}
                        className={`sensor-item ${selectedSensor?.id === sensor.id ? 'selected' : ''} ${sensor.status}`}
                        onClick={() => setSelectedSensor(sensor)}
                      >
                        <div className="sensor-item-header">
                          <span className="sensor-name">{sensor.name}</span>
                          <span className={`status-badge ${sensor.status}`}>
                            {sensor.status === 'normal' ? '정상' : sensor.status === 'warning' ? '경고' : '위험'}
                          </span>
                        </div>
                        <div className="sensor-item-info">
                          <span>유형: {sensor.type}</span>
                          {sensor.value !== undefined && (
                            <span>값: {sensor.value}{sensor.unit || ''}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="detail-item">
                  <label>연결된 액추에이터 ({selectedFacility.actuators.length}개):</label>
                  <div className="actuator-list">
                    {selectedFacility.actuators.map((actuator) => (
                      <div
                        key={actuator.id}
                        className={`actuator-item ${selectedActuator?.id === actuator.id ? 'selected' : ''} ${actuator.status}`}
                        onClick={() => setSelectedActuator(actuator)}
                      >
                        <div className="actuator-item-header">
                          <span className="actuator-name">{actuator.name}</span>
                          <span className={`status-badge ${actuator.status}`}>
                            {actuator.status === 'on' ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <div className="actuator-item-info">
                          <span>유형: {actuator.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

