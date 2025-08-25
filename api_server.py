from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import asyncio
from typing import Optional
import json
import threading
import queue
import time

# Heavy dependencies are imported lazily to allow the server to start
# even when optional CV/audio packages are not installed yet.
try:
    from utils.deepface_webcam import get_predicted_age  # type: ignore
except Exception:
    get_predicted_age = None  # type: ignore

try:
    from voice.voice_chat import VoiceChat  # type: ignore
except Exception:
    VoiceChat = None  # type: ignore

app = FastAPI(title="Kiosk Face Recognition & Voice Chat API", version="1.0.0")

# CORS 설정 - Next.js 웹페이지에서 API 호출 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수로 음성 챗봇 인스턴스 관리
voice_chat_instance: Optional[VoiceChat] = None
voice_chat_thread: Optional[threading.Thread] = None
voice_chat_active = False

# 요청/응답 모델 정의
class FaceRecognitionResponse(BaseModel):
    success: bool
    age: Optional[int] = None
    age_category: Optional[str] = None
    is_elderly: bool = False
    error_message: Optional[str] = None

class VoiceChatRequest(BaseModel):
    order_type: str  # "dineIn" or "takeOut"

class VoiceChatResponse(BaseModel):
    success: bool
    message: str
    session_active: bool = False

class VoiceChatActionRequest(BaseModel):
    action: str  # "set_allergy", "set_diet", "set_category", "add_to_cart", "go_to_payment"
    data: dict = {}  # 액션별 데이터

class VoiceChatActionResponse(BaseModel):
    success: bool
    message: str


@app.get("/")
async def root():
    """API 상태 확인"""
    return {"message": "Kiosk Face Recognition & Voice Chat API is running"}


@app.post("/face-recognition", response_model=FaceRecognitionResponse)
async def recognize_face(camera_index: int = 0):
    """
    얼굴 인식을 수행하여 나이를 예측하고 60세 이상 여부를 판단
    
    Args:
        camera_index: 웹캠 인덱스 (기본값: 0)
        
    Returns:
        FaceRecognitionResponse: 얼굴 인식 결과
    """
    try:
        print(f"\n{'='*50}")
        print(f"[API] 얼굴 인식 요청 시작 - 카메라 인덱스: {camera_index}")
        print(f"{'='*50}")
        
        # 얼굴 인식 및 나이 예측 (의존성 확인)
        if get_predicted_age is None:
            raise HTTPException(status_code=503, detail="얼굴 인식 모듈이 로드되지 않았습니다. 관련 의존성을 설치하세요 (opencv-python, deepface).")

        age = get_predicted_age(camera_index=camera_index)  # type: ignore
        
        if age is None:
            print("[API] ❌ 얼굴 인식 실패 - 얼굴을 찾을 수 없음")
            return FaceRecognitionResponse(
                success=False,
                error_message="얼굴을 감지할 수 없습니다. 다음 사항을 확인해주세요:\n1. 카메라 앞에 얼굴을 정면으로 위치\n2. 충분한 조명 확보\n3. 카메라 렌즈 청소\n4. 다른 앱에서 카메라 사용 중인지 확인"
            )
        
        # 나이 카테고리 분류 (디버깅용 - 조건 반대)
        age_category = "60세 이상" if age >= 60 else "60세 미만"
        is_elderly = age < 60  # 디버깅용: 60세 미만일 때 챗봇 실행
        
        print(f"[API] ✅ 얼굴 인식 성공!")
        print(f"[API] 📊 결과 - 나이: {age}세, 분류: {age_category}")
        print(f"[API] 🐛 디버깅 모드: is_elderly={is_elderly} ({'60세 미만' if is_elderly else '60세 이상'} 사용자가 {'챗봇' if is_elderly else '일반 메뉴'} 실행)")
        print(f"{'='*50}\n")
        
        return FaceRecognitionResponse(
            success=True,
            age=int(age),
            age_category=age_category,
            is_elderly=is_elderly
        )
        
    except Exception as e:
        print(f"[API 오류] ❌ 얼굴 인식 중 예외 발생: {e}")
        import traceback
        traceback.print_exc()
        return FaceRecognitionResponse(
            success=False,
            error_message=f"시스템 오류가 발생했습니다: {str(e)}\n서버 콘솔에서 자세한 오류를 확인하세요."
        )


@app.post("/start-voice-chat", response_model=VoiceChatResponse)
async def start_voice_chat(request: VoiceChatRequest):
    """
    음성 챗봇 세션을 시작
    
    Args:
        request: 주문 타입 정보
        
    Returns:
        VoiceChatResponse: 음성 챗봇 시작 결과
    """
    global voice_chat_instance, voice_chat_thread, voice_chat_active
    
    try:
        print(f"[API] 음성 챗봇 시작 요청 - 주문 타입: {request.order_type}")
        
        # 기존 세션이 활성화되어 있으면 중지
        if voice_chat_active and voice_chat_thread and voice_chat_thread.is_alive():
            print("[API] 기존 음성 챗봇 세션을 종료합니다.")
            voice_chat_active = False
            voice_chat_thread.join(timeout=2.0)
        
        # 새로운 음성 챗봇 인스턴스 생성 (의존성 확인)
        if VoiceChat is None:
            return VoiceChatResponse(
                success=False,
                message="음성 챗봇 모듈이 로드되지 않았습니다. 관련 의존성을 설치하세요 (openai, sounddevice, numpy).",
                session_active=False,
            )

        voice_chat_instance = VoiceChat()  # type: ignore
        voice_chat_active = True
        
        # 별도 스레드에서 음성 챗봇 실행
        def run_voice_chat():
            try:
                print("[API] 🎙️ 음성 챗봇 스레드 시작")
                print(f"[API] 🔧 VoiceChat 인스턴스 생성됨: {voice_chat_instance is not None}")
                
                # VoiceChat 인스턴스의 OpenAI 클라이언트 확인
                if hasattr(voice_chat_instance, 'client'):
                    print(f"[API] 🔑 OpenAI 클라이언트 상태: {voice_chat_instance.client is not None}")
                else:
                    print("[API] ❌ VoiceChat 인스턴스에 client 속성이 없습니다")
                
                voice_chat_instance.run()
                print("[API] ✅ 음성 챗봇이 정상 종료되었습니다")
                
            except Exception as e:
                print(f"[API] ❌ 음성 챗봇 실행 중 오류: {e}")
                import traceback
                traceback.print_exc()
            finally:
                global voice_chat_active
                voice_chat_active = False
                print("[API] 🔚 음성 챗봇 세션 종료")
        
        voice_chat_thread = threading.Thread(target=run_voice_chat, daemon=True)
        voice_chat_thread.start()
        
        # 잠시 대기하여 챗봇이 정상적으로 시작되었는지 확인
        await asyncio.sleep(2.0)  # 1초 -> 2초로 증가
        
        if voice_chat_active:
            return VoiceChatResponse(
                success=True,
                message=f"{request.order_type} 주문을 위한 음성 챗봇이 시작되었습니다. 음성으로 주문해주세요.",
                session_active=True
            )
        else:
            return VoiceChatResponse(
                success=False,
                message="음성 챗봇 시작에 실패했습니다."
            )
            
    except Exception as e:
        print(f"[API 오류] 음성 챗봇 시작 실패: {e}")
        return VoiceChatResponse(
            success=False,
            message=f"음성 챗봇 시작 중 오류가 발생했습니다: {str(e)}"
        )


@app.post("/stop-voice-chat", response_model=VoiceChatResponse)
async def stop_voice_chat():
    """
    음성 챗봇 세션을 중지
    
    Returns:
        VoiceChatResponse: 음성 챗봇 중지 결과
    """
    global voice_chat_instance, voice_chat_thread, voice_chat_active
    
    try:
        print("[API] 음성 챗봇 중지 요청")
        
        if voice_chat_active:
            voice_chat_active = False
            
            # 스레드가 종료될 때까지 잠시 대기
            if voice_chat_thread and voice_chat_thread.is_alive():
                voice_chat_thread.join(timeout=3.0)
            
            voice_chat_instance = None
            voice_chat_thread = None
            
            return VoiceChatResponse(
                success=True,
                message="음성 챗봇이 중지되었습니다.",
                session_active=False
            )
        else:
            return VoiceChatResponse(
                success=True,
                message="음성 챗봇이 이미 중지되어 있습니다.",
                session_active=False
            )
            
    except Exception as e:
        print(f"[API 오류] 음성 챗봇 중지 실패: {e}")
        return VoiceChatResponse(
            success=False,
            message=f"음성 챗봇 중지 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/voice-chat/status")
async def get_voice_chat_status():
    """
    음성 챗봇의 현재 상태를 확인
    
    Returns:
        dict: 음성 챗봇 상태 정보
    """
    global voice_chat_active, voice_chat_thread
    
    is_thread_alive = voice_chat_thread and voice_chat_thread.is_alive()
    
    return {
        "session_active": voice_chat_active and is_thread_alive,
        "thread_alive": is_thread_alive,
        "instance_exists": voice_chat_instance is not None
    }


# 전역 변수로 음성 챗봇 명령을 웹페이지에 전달하기 위한 큐
voice_chat_commands = queue.Queue()

@app.post("/voice-chat/action", response_model=VoiceChatActionResponse)
async def voice_chat_action(request: VoiceChatActionRequest):
    """
    음성 챗봇에서 웹페이지로 액션 전달
    
    Args:
        request: 액션 요청 정보
        
    Returns:
        VoiceChatActionResponse: 액션 처리 결과
    """
    try:
        print(f"[음성 챗봇 액션] {request.action}: {request.data}")
        
        # 명령을 큐에 추가 (웹페이지에서 polling으로 가져감)
        voice_chat_commands.put({
            "action": request.action,
            "data": request.data,
            "timestamp": time.time()
        })
        
        return VoiceChatActionResponse(
            success=True,
            message=f"액션 '{request.action}'이 웹페이지로 전달되었습니다."
        )
        
    except Exception as e:
        print(f"[API 오류] 음성 챗봇 액션 처리 실패: {e}")
        return VoiceChatActionResponse(
            success=False,
            message=f"액션 처리 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/voice-chat/commands")
async def get_voice_chat_commands():
    """
    음성 챗봇 명령들을 웹페이지로 전달
    
    Returns:
        dict: 대기 중인 명령들
    """
    commands = []
    
    # 큐에서 모든 명령 가져오기
    while not voice_chat_commands.empty():
        try:
            command = voice_chat_commands.get_nowait()
            commands.append(command)
        except queue.Empty:
            break
    
    return {
        "success": True,
        "commands": commands,
        "count": len(commands)
    }


@app.get("/debug/voice-chat-test")
async def debug_voice_chat_test():
    """디버깅용: VoiceChat 초기화 테스트"""
    try:
        print("[DEBUG] VoiceChat 초기화 테스트 시작")
        test_instance = VoiceChat()
        
        return {
            "success": True,
            "message": "VoiceChat 초기화 성공",
            "has_client": test_instance.client is not None,
            "menu_items_count": len(test_instance.menu_data.get('items', [])) if test_instance.menu_data else 0
        }
    except Exception as e:
        print(f"[DEBUG] VoiceChat 초기화 실패: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "message": "VoiceChat 초기화 실패"
        }


@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    print("[API] Kiosk Face Recognition & Voice Chat API 서버가 시작되었습니다.")
    
    # 환경 변수 확인
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(f"[API] ✅ OpenAI API 키 로드됨: {api_key[:10]}...{api_key[-10:]}")
    else:
        print("[API] ❌ OpenAI API 키가 로드되지 않았습니다!")
        print("[API] 📂 .env 파일을 확인하세요.")


@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 정리"""
    global voice_chat_active, voice_chat_thread
    
    print("[API] API 서버를 종료합니다...")
    
    # 활성화된 음성 챗봇 세션 종료
    if voice_chat_active:
        voice_chat_active = False
        if voice_chat_thread and voice_chat_thread.is_alive():
            voice_chat_thread.join(timeout=2.0)
    
    print("[API] API 서버 종료 완료")


if __name__ == "__main__":
    print("FastAPI 서버를 시작합니다...")
    print("- 얼굴 인식 API: POST /face-recognition")
    print("- 음성 챗봇 시작: POST /start-voice-chat")
    print("- 음성 챗봇 중지: POST /stop-voice-chat")
    print("- 음성 챗봇 상태: GET /voice-chat/status")
    print("- 서버 주소: http://localhost:8000")
    print("- API 문서: http://localhost:8000/docs")
    
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )