# Mock Data 가이드

프론트엔드 개발을 위한 목 데이터 시스템입니다.

## 사용 방법

### 1. 환경 변수 설정

`.env` 파일에 다음을 추가하여 Mock 모드를 활성화할 수 있습니다:

```env
VITE_USE_MOCK=true
```

또는 API URL이 `localhost`를 포함하면 자동으로 Mock 모드가 활성화됩니다.

### 2. Mock 데이터 구조

#### 센서 데이터 (`mockSensors`)
- 스마트팜코리아 권장 센서 12개 포함
- 온도, 습도, CO₂, PAR, 일사량, 토양 수분, 토양 EC, 토양 pH, 풍속, 풍향, 엽면 습도, 감우

#### 액추에이터 데이터 (`mockActuators`)
- 환기팬, 난방기, 관수 밸브, 양액기, 스크린, CO₂ 공급기, 인공광

#### 로봇 데이터 (`mockRobots`)
- 수확 로봇, 관수 로봇, 모니터링 로봇

#### 룰 데이터 (`mockRules`)
- 고온 환기 룰, 저습도 가습 룰, 토양 수분 관수 룰, CO₂ 부족 공급 룰

#### 알람 데이터 (`mockAlarms`)
- 다양한 심각도(정보, 경고, 위험)의 알람 예시

#### 대시보드 요약 (`mockDashboardSummary`)
- 센서, 액추에이터, 로봇, 룰, 알람 통계

#### 데이터셋 (`mockDatasets`)
- 시설원예 데이터셋, AI 경진대회용 이미지셋, 기상융복합 서비스 데이터

## API 사용 예시

```typescript
import { sensorsApi, dashboardApi } from './api/client';

// Mock 모드에서 자동으로 목 데이터 반환
const sensors = await sensorsApi.getAll();
const summary = await dashboardApi.getSummary();
```

## 시계열 데이터 생성

```typescript
import { generateMockSensorData, generateRealtimeSensorData } from './data/mockData';

// 24시간 데이터 생성
const data24h = generateMockSensorData(1, 'temperature', 24);

// 실시간 데이터 생성 (최근 50개 포인트)
const realtimeData = generateRealtimeSensorData('temperature', 50);
```

## Mock 데이터 수정

`packages/frontend/src/data/mockData.ts` 파일을 수정하여 목 데이터를 변경할 수 있습니다.

## 주의사항

- Mock 모드에서는 실제 백엔드와 통신하지 않습니다.
- 데이터 변경은 메모리에만 저장되며, 페이지 새로고침 시 초기화됩니다.
- 실제 백엔드와 연동하려면 `VITE_USE_MOCK=false`로 설정하거나 환경 변수를 제거하세요.

