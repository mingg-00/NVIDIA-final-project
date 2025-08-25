# 키오스크 얼굴 인식 & 음성 챗봇 통합 시스템

## 🎯 개요

이 프로젝트는 Next.js 웹 키오스크와 Python 얼굴 인식/음성 챗봇을 FastAPI로 연결한 통합 시스템입니다.

### 주요 기능
- **얼굴 인식**: 웹캠을 통해 사용자 나이 감지 (60세 기준)
- **음성 챗봇**: 60세 이상 사용자를 위한 음성 주문 시스템  
- **웹 키오스크**: Next.js 기반 메뉴 선택 인터페이스
- **API 연동**: FastAPI를 통한 프론트엔드-백엔드 통신

## 🏗️ 시스템 구조

```
NVIDIA-final-project/
├── 🐍 Python 백엔드
│   ├── api_server.py          # FastAPI 서버
│   ├── main.py               # 얼굴 인식 메인 로직
│   ├── utils/deepface_webcam.py   # DeepFace 얼굴 인식
│   └── voice/voice_chat.py   # OpenAI 음성 챗봇
│
├── 🌐 Next.js 웹페이지
│   └── kiosk-menu/
│       └── app/page.tsx      # 키오스크 메인 컴포넌트
│
├── ⚙️ 설정 및 실행
│   ├── requirements.txt      # Python 의존성
│   ├── start_server.py       # API 서버 시작 스크립트
│   └── start_webpage.sh      # 웹페이지 시작 스크립트
└── 📄 문서
    └── API_INTEGRATION_README.md
```

## 🔧 설치 및 설정

### 1. Python 의존성 설치

```bash
# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\\Scripts\\activate  # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 2. Node.js 의존성 설치

```bash
cd kiosk-menu
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 🚀 실행 방법

### 방법 1: 자동 스크립트 사용

**터미널 1** - API 서버 시작:
```bash
python start_server.py
```

**터미널 2** - 웹페이지 시작:
```bash
./start_webpage.sh
```

### 방법 2: 수동 실행

**터미널 1** - API 서버:
```bash
python api_server.py
# 또는
uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

**터미널 2** - 웹페이지:
```bash
cd kiosk-menu
npm run dev
```

## 🌐 접속 주소

- **키오스크 웹페이지**: http://localhost:3000
- **API 서버**: http://localhost:8000  
- **API 문서**: http://localhost:8000/docs

## 📱 사용 방법

### 1. 주문 시작
1. 키오스크 웹페이지 (http://localhost:3000) 접속
2. "매장에서 식사" 또는 "포장" 버튼 클릭

### 2. 얼굴 인식 진행  
3. 자동으로 얼굴 인식 시작
4. 웹캠 앞에 얼굴을 정면으로 위치
5. 나이 감지 결과 확인

### 3. 주문 진행
**60세 이상인 경우:**
- 음성 챗봇 자동 시작
- 음성으로 메뉴 주문 가능
- AI가 주문을 받아 처리

**60세 미만인 경우:**
- 일반 키오스크 메뉴 화면 표시
- 터치로 메뉴 선택 및 주문

## 🔧 API 엔드포인트

### 얼굴 인식 API
```http
POST /face-recognition
Content-Type: application/json

{
    "camera_index": 0
}
```

**응답:**
```json
{
    "success": true,
    "age": 65,
    "age_category": "60세 이상", 
    "is_elderly": true
}
```

### 음성 챗봇 시작 API
```http
POST /start-voice-chat
Content-Type: application/json

{
    "order_type": "dineIn"
}
```

### 음성 챗봇 중지 API
```http
POST /stop-voice-chat
```

### 음성 챗봇 상태 확인
```http
GET /voice-chat/status
```

## 🐛 트러블슈팅

### 얼굴 인식이 작동하지 않는 경우
1. **웹캠 권한 확인**: 브라우저에서 카메라 권한 허용
2. **카메라 연결**: 다른 앱에서 카메라 사용 중인지 확인
3. **조명 확인**: 얼굴이 잘 보이도록 충분한 조명 필요
4. **의존성 확인**: `opencv-python`, `deepface` 설치 여부

### 음성 챗봇이 작동하지 않는 경우
1. **API 키 확인**: `.env` 파일의 `OPENAI_API_KEY` 설정
2. **마이크 권한**: 시스템 마이크 권한 허용
3. **오디오 장치**: 마이크와 스피커 연결 상태 확인
4. **인터넷 연결**: OpenAI API 호출을 위한 네트워크 연결

### API 서버 연결 실패
1. **서버 실행**: `python start_server.py`로 API 서버 시작 여부 확인
2. **포트 충돌**: 8000번 포트가 다른 프로세스에서 사용 중인지 확인
3. **방화벽**: 로컬 방화벽에서 8000번 포트 허용
4. **CORS 설정**: 브라우저 콘솔에서 CORS 오류 확인

### 웹페이지 로딩 실패
1. **Node.js 설치**: Node.js와 npm 설치 여부 확인
2. **의존성 설치**: `cd kiosk-menu && npm install` 실행
3. **포트 충돌**: 3000번 포트 사용 중인 다른 프로세스 종료

## 🔍 로그 확인

### API 서버 로그
```bash
# API 서버 콘솔에서 확인 가능한 로그들:
[API] 얼굴 인식 시작 - 카메라 인덱스: 0
[API] 얼굴 인식 완료 - 나이: 65세, 분류: 60세 이상
[API] 음성 챗봇 시작 요청 - 주문 타입: dineIn
```

### 웹페이지 로그  
```bash
# 브라우저 개발자 도구 콘솔에서 확인:
60세 이상 사용자 - 음성 챗봇 시작
60세 미만 사용자 - 일반 메뉴로 진행
```

## 📈 향후 개선 사항

- [ ] 얼굴 인식 정확도 향상
- [ ] 음성 인식 지연 시간 단축  
- [ ] 주문 데이터 데이터베이스 저장
- [ ] 결제 시스템 연동
- [ ] 다국어 지원
- [ ] 키오스크 하드웨어 최적화

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.