# SmartFarm 설정 가이드

이 문서는 SmartFarm 솔루션을 설정하고 실행하는 방법을 안내합니다.

## 사전 요구사항

### 필수
- **Node.js** 18 이상
- **PostgreSQL** 14 이상
- **npm** 또는 **yarn**

### 선택사항 (기능 확장용)
- **InfluxDB** 2.0 이상 (시계열 데이터 저장)
- **MQTT Broker** (센서 통신, 예: Mosquitto)

## 1. 프로젝트 설치

```bash
# 저장소 클론 (또는 프로젝트 디렉토리로 이동)
cd smartfarm

# 루트 의존성 설치
npm install

# 모든 패키지 의존성 설치
npm run install:all
```

## 2. 데이터베이스 설정

### PostgreSQL 설치 및 설정

#### Windows
1. [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 다운로드
2. 설치 후 PostgreSQL 서비스 시작

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE smartfarm;

# 사용자 생성 (선택사항)
CREATE USER smartfarm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smartfarm TO smartfarm_user;

# 종료
\q
```

## 3. 환경 변수 설정

### Backend 환경 변수

`packages/backend/.env` 파일 생성:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=smartfarm
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# InfluxDB (선택사항)
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token-here
INFLUXDB_ORG=smartfarm
INFLUXDB_BUCKET=sensor-data

# MQTT (선택사항)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# JWT (향후 사용)
JWT_SECRET=your-secret-key-change-in-production
```

## 4. InfluxDB 설정 (선택사항)

### InfluxDB 설치

#### Docker 사용 (권장)
```bash
docker run -d -p 8086:8086 \
  -v influxdb-storage:/var/lib/influxdb2 \
  -v influxdb-config:/etc/influxdb2 \
  -e DOCKER_INFLUXDB_INIT_MODE=setup \
  -e DOCKER_INFLUXDB_INIT_USERNAME=admin \
  -e DOCKER_INFLUXDB_INIT_PASSWORD=password123 \
  -e DOCKER_INFLUXDB_INIT_ORG=smartfarm \
  -e DOCKER_INFLUXDB_INIT_BUCKET=sensor-data \
  influxdb:2.7
```

#### 직접 설치
1. [InfluxDB 공식 사이트](https://www.influxdata.com/downloads/)에서 다운로드
2. 설치 후 InfluxDB 시작
3. 웹 UI (http://localhost:8086)에서 설정:
   - Organization: `smartfarm`
   - Bucket: `sensor-data`
   - Token 생성 및 `.env`에 추가

### InfluxDB 없이 사용
InfluxDB가 설정되지 않아도 시스템은 정상 작동합니다. Mock 데이터를 사용하여 테스트할 수 있습니다.

## 5. MQTT Broker 설정 (선택사항)

### Mosquitto 설치

#### Docker 사용 (권장)
```bash
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

#### 직접 설치

#### Windows
1. [Mosquitto 다운로드](https://mosquitto.org/download/)
2. 설치 후 서비스 시작

#### macOS
```bash
brew install mosquitto
brew services start mosquitto
```

#### Linux
```bash
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

### MQTT 없이 사용
MQTT 브로커가 없어도 시스템은 정상 작동합니다. 내장 시뮬레이터가 자동으로 실행되어 테스트 데이터를 생성합니다.

## 6. 테스트 데이터 추가

```bash
cd packages/backend
npm run seed
```

이 명령은 다음을 생성합니다:
- 6개의 샘플 센서
- 5개의 샘플 액추에이터
- 3개의 샘플 로봇
- 3개의 샘플 자동화 규칙

## 7. 애플리케이션 실행

### 개발 모드 (Backend + Frontend 동시 실행)

```bash
# 루트 디렉토리에서
npm run dev
```

### 개별 실행

```bash
# Backend만 실행
npm run dev:backend

# Frontend만 실행
npm run dev:frontend
```

## 8. 접속 확인

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **WebSocket**: ws://localhost:3001/ws

## 9. 문제 해결

### 데이터베이스 연결 오류
- PostgreSQL이 실행 중인지 확인
- `.env` 파일의 데이터베이스 설정 확인
- 데이터베이스가 생성되었는지 확인

### 포트 충돌
- 다른 애플리케이션이 3000 또는 3001 포트를 사용 중인지 확인
- `.env` 파일에서 포트 변경 가능

### MQTT 연결 오류
- MQTT 브로커가 실행 중인지 확인
- 브로커 URL이 올바른지 확인
- MQTT 없이도 시뮬레이터가 자동으로 실행됩니다

### InfluxDB 연결 오류
- InfluxDB가 실행 중인지 확인
- Token이 올바른지 확인
- InfluxDB 없이도 Mock 데이터로 작동합니다

## 10. 프로덕션 배포

### 빌드

```bash
# 전체 빌드
npm run build

# 개별 빌드
npm run build:backend
npm run build:frontend
```

### 환경 변수
프로덕션 환경에서는 반드시:
- 강력한 `JWT_SECRET` 설정
- 데이터베이스 비밀번호 변경
- HTTPS 사용
- 환경 변수 보안 관리

## 추가 리소스

- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [InfluxDB 문서](https://docs.influxdata.com/)
- [MQTT 문서](https://mqtt.org/documentation)
- [프로젝트 문서](./docs/)

