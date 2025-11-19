# 하모니 스마트팜 (Harmony SmartFarm)

IoT 센서, AI 분석, 로봇 자동화, 환경 제어 기술을 통합한 차세대 농업 플랫폼입니다.

## 프로젝트 구조

```
smartfarm/
├── packages/
│   ├── backend/          # Backend API 서버 (Express + TypeScript)
│   └── frontend/         # Frontend React 앱 (React + TypeScript + Vite)
├── docs/                 # 문서
└── README.md
```

## 시작하기

### 사전 요구사항

- Node.js 18+ 
- PostgreSQL 14+
- InfluxDB 2.0+ (선택사항, 시계열 데이터용)
- MQTT Broker (선택사항, 센서 통신용)

### 설치

```bash
# 루트 디렉토리에서
npm install

# 모든 패키지 설치
npm run install:all
```

### 환경 변수 설정

Backend 환경 변수 설정:

```bash
cd packages/backend
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 및 기타 설정 구성
```

### 데이터베이스 설정

PostgreSQL 데이터베이스 생성:

```sql
CREATE DATABASE smartfarm;
```

애플리케이션 시작 시 자동으로 스키마가 생성됩니다.

### 실행

#### 개발 모드 (Backend + Frontend 동시 실행)

```bash
npm run dev
```

#### 개별 실행

```bash
# Backend만 실행
npm run dev:backend

# Frontend만 실행
npm run dev:frontend
```

#### 테스트 데이터 시드

데이터베이스에 샘플 데이터를 추가하려면:

```bash
cd packages/backend
npm run seed
```

이 명령은 다음을 생성합니다:
- 6개의 샘플 센서
- 5개의 샘플 액추에이터
- 3개의 샘플 로봇
- 3개의 샘플 자동화 규칙

### 접속

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 주요 기능

### ✅ 구현 완료

- [x] Backend API 서버 (Express + TypeScript)
- [x] 데이터베이스 스키마 및 서비스 레이어
- [x] 센서 데이터 수집 (MQTT 통신)
- [x] Rule Engine (자동화 규칙 실행)
- [x] 알람 시스템
- [x] Frontend React 앱
- [x] Dashboard UI (실시간 업데이트)
- [x] Sensors 관리 페이지 (완전한 CRUD)
- [x] Control (액추에이터 제어) 페이지
- [x] Robots 관리 페이지
- [x] Rules 관리 페이지
- [x] Alarms 페이지
- [x] Monitoring 페이지 (실시간 차트)
- [x] WebSocket 실시간 통신
- [x] 데이터 시각화 (Recharts)
- [x] AI 서비스 기본 구조
- [x] 테스트 데이터 시드 스크립트
- [x] 모달 및 폼 컴포넌트

### ✅ 최근 추가된 기능

- [x] InfluxDB 완전 연동 (Mock 데이터 지원 포함)
- [x] MQTT 센서 시뮬레이터 (테스트용)
- [x] Rule Builder 시각적 UI
- [x] 리포트 생성 기능 (일/주/월)
- [x] 설정 가이드 문서

### 🔄 향후 개선 사항

- [ ] AI 서비스 실제 모델 연동 (Python FastAPI)
- [ ] 사용자 인증/권한 관리
- [ ] 모바일 반응형 최적화
- [ ] 다국어 지원

## API 엔드포인트

### Sensors
- `GET /api/sensors` - 모든 센서 조회
- `GET /api/sensors/:id` - 센서 상세 조회
- `GET /api/sensors/:id/data` - 센서 데이터 조회
- `POST /api/sensors` - 센서 생성
- `PUT /api/sensors/:id` - 센서 수정
- `DELETE /api/sensors/:id` - 센서 삭제

### Control
- `GET /api/control/actuators` - 모든 액추에이터 조회
- `POST /api/control/actuators/:id/control` - 액추에이터 제어

### Robots
- `GET /api/robots` - 모든 로봇 조회
- `POST /api/robots/:id/command` - 로봇 명령 전송

### Rules
- `GET /api/rules` - 모든 규칙 조회
- `POST /api/rules` - 규칙 생성
- `PUT /api/rules/:id` - 규칙 수정
- `DELETE /api/rules/:id` - 규칙 삭제
- `POST /api/rules/:id/toggle` - 규칙 활성화/비활성화

### Alarms
- `GET /api/alarms` - 모든 알람 조회
- `POST /api/alarms/:id/read` - 알람 읽음 처리
- `POST /api/alarms/:id/resolve` - 알람 해결 처리

### Dashboard
- `GET /api/dashboard/summary` - 대시보드 요약 정보
- `GET /api/dashboard/status` - 시스템 상태
- `GET /api/dashboard/sensors/recent` - 최근 센서 데이터

### AI
- `POST /api/ai/analyze-crop` - 작물 분석
- `POST /api/ai/detect-disease` - 병충해 탐지
- `POST /api/ai/predict-irrigation` - 관수 예측
- `POST /api/ai/analyze-trends` - 트렌드 분석

### WebSocket
- `ws://localhost:3001/ws` - 실시간 데이터 스트림
  - `sensor_update` - 센서 데이터 업데이트
  - `alarm` - 알람 발생
  - `actuator_update` - 액추에이터 상태 업데이트
  - `robot_update` - 로봇 상태 업데이트

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD` - 일일 리포트
- `GET /api/reports/weekly?week=YYYY-MM-DD` - 주간 리포트
- `GET /api/reports/monthly?month=YYYY-MM` - 월간 리포트

## 기술 스택

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- InfluxDB (시계열 데이터)
- MQTT (센서 통신)

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios

## 문서

- [전체 문서](./docs/) - 기능별 상세 문서
- [설정 가이드](./SETUP.md) - 설치 및 설정 방법

## 빠른 시작

### 1. 설치
```bash
npm run install:all
```

### 2. 데이터베이스 설정
```sql
CREATE DATABASE smartfarm;
```

### 3. 환경 변수 설정
`packages/backend/.env` 파일 생성 (자세한 내용은 [SETUP.md](./SETUP.md) 참조)

### 4. 테스트 데이터 추가
```bash
cd packages/backend
npm run seed
```

### 5. 실행
```bash
npm run dev
```

### 6. 접속
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 주요 특징

### 🚀 즉시 사용 가능
- MQTT 브로커 없이도 시뮬레이터로 테스트 가능
- InfluxDB 없이도 Mock 데이터로 작동
- PostgreSQL만 있으면 바로 시작 가능

### 📊 실시간 모니터링
- WebSocket 기반 실시간 데이터 업데이트
- 실시간 차트 및 그래프
- 실시간 알람 알림

### 🤖 자동화
- 시각적 Rule Builder
- 조건 기반 자동 제어
- 우선순위 기반 규칙 실행

### 📈 리포트
- 일/주/월 단위 리포트 생성
- JSON 다운로드 지원
- 통계 및 분석 데이터 포함

## 라이선스

MIT

