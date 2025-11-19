# Vercel 배포 가이드

하모니 스마트팜을 Vercel에 배포하는 방법입니다.

## 배포 옵션

### 옵션 1: 프론트엔드만 Vercel에 배포 (권장)

프론트엔드는 Vercel에 배포하고, 백엔드는 별도 서버(Railway, Render, Heroku 등)에 배포합니다.

#### 배포 단계

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **프론트엔드 디렉토리로 이동**
   ```bash
   cd packages/frontend
   ```

3. **Vercel 로그인 및 배포**
   ```bash
   vercel login
   vercel
   ```

4. **환경 변수 설정**
   Vercel 대시보드에서 다음 환경 변수를 설정:
   - `VITE_API_URL`: 백엔드 API URL (예: https://your-backend.railway.app/api)
   - `VITE_WS_URL`: WebSocket URL (예: wss://your-backend.railway.app/ws)
   - `VITE_USE_MOCK`: `false` (실제 백엔드 사용 시)

5. **재배포**
   ```bash
   vercel --prod
   ```

### 옵션 2: Vercel Serverless Functions로 백엔드 API 변환

백엔드를 Vercel Serverless Functions로 변환하여 함께 배포할 수 있습니다.

#### 제한사항
- PostgreSQL, InfluxDB 등 외부 데이터베이스 필요
- WebSocket은 Vercel에서 제한적 지원
- MQTT는 외부 서비스 필요

#### 배포 단계

1. **프로젝트 루트에서 배포**
   ```bash
   vercel
   ```

2. **환경 변수 설정**
   - `POSTGRES_HOST`
   - `POSTGRES_PORT`
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `INFLUXDB_URL`
   - `INFLUXDB_TOKEN`
   - `MQTT_BROKER_URL`

## 현재 구성

### 프론트엔드
- ✅ Vercel 배포 준비 완료
- ✅ Mock 데이터 시스템 포함
- ✅ 환경 변수 기반 API URL 설정

### 백엔드
- ⚠️ 전통적인 Express 서버 (Vercel Serverless Functions로 변환 필요)
- ⚠️ PostgreSQL, InfluxDB, MQTT 등 외부 서비스 의존

## 권장 배포 구조

```
프론트엔드: Vercel
    ↓
백엔드 API: Railway / Render / Heroku
    ↓
데이터베이스: PostgreSQL (Supabase / Railway / Neon)
    ↓
시계열 DB: InfluxDB Cloud
    ↓
MQTT: HiveMQ Cloud / AWS IoT Core
```

## 빠른 시작 (프론트엔드만)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프론트엔드 디렉토리로 이동
cd packages/frontend

# 3. 배포
vercel

# 4. 환경 변수 설정 (Vercel 대시보드)
VITE_USE_MOCK=true  # Mock 모드로 시작
```

## Mock 모드로 배포

백엔드 없이 프론트엔드만 배포하려면:

1. 환경 변수 설정:
   ```
   VITE_USE_MOCK=true
   ```

2. 배포:
   ```bash
   cd packages/frontend
   vercel --prod
   ```

이렇게 하면 백엔드 없이도 프론트엔드가 Mock 데이터로 동작합니다.

