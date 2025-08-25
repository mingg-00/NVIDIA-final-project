#!/usr/bin/env python3
"""
키오스크 FastAPI 서버 시작 스크립트

역할:
- FastAPI 서버를 시작하여 얼굴 인식과 음성 챗봇 API 제공
- 웹페이지에서 호출할 수 있는 RESTful API 엔드포인트 제공

사용법:
    python start_server.py
"""

import sys
import os
import subprocess
from pathlib import Path


def check_dependencies():
    """필수 의존성 확인"""
    required_packages = [
        'fastapi',
        'uvicorn', 
        'opencv-python',
        'deepface',
        'openai',
        'sounddevice',
        'numpy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ 다음 패키지들이 설치되지 않았습니다:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n다음 명령으로 설치하세요:")
        print(f"   pip install {' '.join(missing_packages)}")
        print("\n또는 requirements.txt로 일괄 설치:")
        print("   pip install -r requirements.txt")
        return False
    
    return True


def check_env_file():
    """환경 변수 파일 확인"""
    env_path = Path(__file__).parent / '.env'
    
    if not env_path.exists():
        print("⚠️  .env 파일이 없습니다.")
        print("   OpenAI API 키가 설정되지 않으면 음성 챗봇이 작동하지 않을 수 있습니다.")
        print("   .env 파일을 생성하고 다음과 같이 설정하세요:")
        print("   OPENAI_API_KEY=your_api_key_here")
        print()
        
        response = input("계속 진행하시겠습니까? (y/n): ").strip().lower()
        if response not in ['y', 'yes', '예']:
            return False
    
    return True


def main():
    """메인 실행 함수"""
    print("🚀 키오스크 FastAPI 서버 시작")
    print("=" * 50)
    
    # 의존성 확인
    print("1. 의존성 확인 중...")
    if not check_dependencies():
        sys.exit(1)
    print("✅ 모든 의존성이 설치되어 있습니다.")
    
    # 환경 변수 확인
    print("\n2. 환경 설정 확인 중...")
    if not check_env_file():
        sys.exit(1)
    print("✅ 환경 설정이 완료되었습니다.")
    
    print("\n3. FastAPI 서버 시작 중...")
    print("   - 서버 주소: http://localhost:8000")
    print("   - API 문서: http://localhost:8000/docs")
    print("   - Next.js 웹페이지: http://localhost:3000")
    print("   - 종료하려면 Ctrl+C를 누르세요")
    print("=" * 50)
    
    try:
        # FastAPI 서버 실행
        import uvicorn
        uvicorn.run(
            "api_server:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n\n🛑 서버가 종료되었습니다.")
    except Exception as e:
        print(f"\n❌ 서버 시작 중 오류 발생: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()