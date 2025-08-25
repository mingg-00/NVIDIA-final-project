#!/bin/bash

# 키오스크 웹페이지 시작 스크립트
echo "🌐 키오스크 웹페이지 시작"
echo "=========================="

# kiosk-menu 디렉토리로 이동
cd kiosk-menu

# Node.js 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 Node.js 의존성 설치 중..."
    npm install
fi

echo "✅ Next.js 개발 서버 시작 중..."
echo "   - 웹페이지 주소: http://localhost:3000"
echo "   - API 서버: http://localhost:8000"
echo "   - 종료하려면 Ctrl+C를 누르세요"
echo "=========================="

# Next.js 개발 서버 실행
npm run dev