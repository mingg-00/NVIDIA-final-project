# Streamlit 키오스크 메뉴 시스템

이 프로젝트는 원본 Next.js 키오스크 메뉴 시스템을 Streamlit으로 재구현한 버전입니다.

## 기능

- 🍔 메뉴 카테고리별 탐색 (메인, 사이드, 음료, 디저트)
- 🏷️ 서브카테고리 필터링 (버거, 랩, 보울, 샐러디)
- 🚫 알레르기 필터링
- 🥗 식단 필터링 (일반, 채식, 비건)
- 👥 어르신 모드 / 일반 모드 전환
- 🛒 장바구니 기능
- 💳 결제 시스템 시뮬레이션
- 📦 매장/포장 주문 선택

## 설치 및 실행

1. 필요한 패키지 설치:
```bash
pip install -r requirements.txt
```

2. 애플리케이션 실행:
```bash
streamlit run app.py
```

3. 브라우저에서 `http://localhost:8501` 접속

## 파일 구조

- `app.py`: 메인 Streamlit 애플리케이션
- `menu_data.py`: 메뉴 데이터 및 설정
- `requirements.txt`: 필요한 Python 패키지
- `public/`: 메뉴 이미지 파일들

## 주요 차이점

원본 Next.js 버전과 비교한 주요 차이점:

1. **UI 프레임워크**: React/Next.js → Streamlit
2. **상태 관리**: React hooks → Streamlit session state
3. **스타일링**: Tailwind CSS → Streamlit 기본 스타일 + 커스텀 CSS
4. **이미지 처리**: Next.js Image → PIL/Streamlit
5. **라우팅**: Next.js routing → 조건부 렌더링

## 구현된 기능

✅ 주문 방식 선택 (매장/포장)
✅ 메뉴 카테고리 및 서브카테고리 탐색
✅ 알레르기 및 식단 필터링
✅ 어르신 모드 / 일반 모드
✅ 장바구니 추가/수정/삭제
✅ 메뉴 상세 정보 표시
✅ 결제 시스템 시뮬레이션
✅ 주문 완료 처리

## 미구현 기능

- 음성 인식 기능
- 실시간 오디오 레벨 표시
- 비활성 상태 감지 및 도움 팝업
- 직원 호출 기능
- 실제 결제 연동

이러한 기능들은 Streamlit의 제약으로 인해 구현이 어렵거나 별도의 확장이 필요합니다.