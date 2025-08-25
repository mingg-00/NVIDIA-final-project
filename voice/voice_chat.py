from __future__ import annotations

import os
import sys
import time
import threading
import queue
import json
# import io
import wave
# import asyncio
import select
from typing import Optional, Generator, AsyncGenerator
from collections import deque

from dotenv import load_dotenv
from pathlib import Path

# Ensure .env is loaded from project root regardless of CWD
_ENV_PATH = (Path(__file__).resolve().parent.parent / ".env").resolve()
load_dotenv(_ENV_PATH)

# openai 설치 확인 
def _has_openai() -> bool:
    try:
        from openai import OpenAI  # noqa: F401
        return True
    except Exception:
        return False

class VoiceChat:
    def __init__(self):
        self.base = Path(__file__).resolve().parent.parent
        # tmp 디렉터리 경로 수정 (절대경로 슬래시 제거)
        self.tmp_dir = self.base / "_tmp"
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        
        # 메뉴 데이터 로드
        self.menu_data = self._load_menu_data()
        
        # 실시간 오디오 스트림 관련
        self.audio_queue = queue.Queue() # thread -> STT
        self.tts_queue = queue.Queue() # llm response -> tts -> playing
        self.is_recording = False
        self.is_playing = False
        self.is_processing = False
        
        # 버퍼링을 위한 큐 -> 최신 n개의 데이터 유지해서 맥락 구성에 활용 
        self.text_buffer = deque(maxlen=10)
        self.audio_buffer = deque(maxlen=5)
        
        # 오디오 시스템 초기화
        self._init_audio_system()
        
        # OpenAI 클라이언트
        if _has_openai() and os.getenv("OPENAI_API_KEY"):
            from openai import OpenAI
            self.client = OpenAI()
        else:
            self.client = None
            print("OpenAI API 키가 설정되지 않았습니다.")
    
    def _load_menu_data(self) -> dict:
        """메뉴 데이터 로드"""
        try:
            menu_path = self.base / "menu.json"
            if menu_path.exists():
                with open(menu_path, 'r', encoding='utf-8') as f:
                    menu_data = json.load(f)
                print(f"[메뉴 데이터] {len(menu_data.get('items', []))}개 메뉴 항목 로드 완료")
                return menu_data
            else:
                print(f"[메뉴 데이터] menu.json 파일을 찾을 수 없습니다: {menu_path}")
                return {}
        except Exception as e:
            print(f"[메뉴 데이터 로드 실패] {e}")
            return {}
    
    def _get_menu_context(self) -> str:
        """메뉴 데이터를 LLM 컨텍스트로 변환"""
        if not self.menu_data:
            return ""
        
        try:
            context_parts = []
            
            # 매장 정보
            store_name = self.menu_data.get('store', '키오스크')
            context_parts.append(f"매장명: {store_name}")
            
            # 메뉴 카테고리별 정리
            items = self.menu_data.get('items', [])
            categories = {}
            
            for item in items:
                category = item.get('category', '기타')
                if category not in categories:
                    categories[category] = []
                
                # 메뉴 정보 요약
                menu_info = f"- {item.get('name', '')} ({item.get('price', 0):,}원)"
                
                # 알레르기 정보 추가
                allergens = item.get('allergens', [])
                if allergens:
                    menu_info += f" [알레르기: {', '.join(allergens)}]"
                
                # 영양 정보 추가
                nutrition = item.get('nutrition', {})
                if nutrition.get('calorie_kcal'):
                    menu_info += f" [칼로리: {nutrition['calorie_kcal']}kcal]"
                
                categories[category].append(menu_info)
            
            # 카테고리별 메뉴 정보 추가
            for category, menu_list in categories.items():
                context_parts.append(f"\n{category}:")
                context_parts.extend(menu_list)
            
            # 알레르기 정보
            allergen_vocab = self.menu_data.get('allergen_vocab', [])
            if allergen_vocab:
                context_parts.append(f"\n알레르기 정보: {', '.join(allergen_vocab)}")
            
            return "\n".join(context_parts)
            
        except Exception as e:
            print(f"[메뉴 컨텍스트 생성 실패] {e}")
            return ""
    
    def _search_menu_items(self, query: str) -> list:
        """메뉴 검색 기능"""
        if not self.menu_data:
            return []
        
        try:
            items = self.menu_data.get('items', [])
            results = []
            query_lower = query.lower()
            
            for item in items:
                name = item.get('name', '').lower()
                category = item.get('category', '').lower()
                notes = item.get('notes', '').lower()
                
                # 이름, 카테고리, 메모에서 검색
                if (query_lower in name or 
                    query_lower in category or 
                    query_lower in notes):
                    results.append(item)
            
            return results
            
        except Exception as e:
            print(f"[메뉴 검색 실패] {e}")
            return []
    
    def _init_audio_system(self):
        """오디오 시스템 초기화"""
        try:
            import sounddevice as sd # PortAudio 기반 
            import numpy as np
            
            # 현재 PC에서의 모든 오디오 장치 정보 확인
            devices = sd.query_devices()
            print(f"[오디오 시스템] 사용 가능한 장치: {len(devices)}개")
            
            # 기본 출력/재생 장치 설정
            default_output = sd.query_devices(kind='output')
            print(f"[오디오 시스템] 기본 출력: {default_output['name']}")
            
            # 오디오 시스템 테스트 (무음 재생)
            # test_audio = np.zeros(1000, dtype=np.int16)
            # sd.play(test_audio, samplerate=24000)
            # sd.wait()
            
            print("[오디오 시스템] 초기화 완료")
            
        except Exception as e:
            print(f"[오디오 시스템 초기화 실패] {e}")
    
    def _create_tts_stream(self, text: str) -> bytes:
        """
        TTS 스트림 생성 (PCM 형식)
        PCM(Pulse-code Modulation): 디지털 오디오 데이터 형식 
        """
        if not self.client:
            return b""
            
        try:
            print(f"[TTS 요청] 텍스트: {text}")
            
            response = self.client.audio.speech.create(
                model="gpt-4o-mini-tts", # tts 모델 설정 
                voice="nova", # 음성 -> 나긋하고 친절한 목소리 
                input=text,
                response_format="pcm",  # PCM 형식으로 스트리밍
                speed=1.0
            )
            
            # 응답 데이터 검증
            if response.content and len(response.content) > 0:
                print(f"[TTS 응답] 데이터 크기: {len(response.content)} bytes")
                return response.content
            else:
                print(f"[TTS 스트림 생성 실패] 빈 응답")
                return b""
                
        except Exception as e:
            print(f"[TTS 스트림 생성 실패] {e}")
            return b""
    
    def _play_audio_stream(self, audio_data: bytes, sample_rate: int = 24000) -> None:
        """오디오 스트림 재생"""
        try:
            import sounddevice as sd
            import numpy as np
            
            # PCM 데이터를 numpy 배열로 변환
            # 신호를 숫자 데이터로 변환 
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            
            # 오디오 데이터 검증 및 전처리
            if len(audio_array) == 0:
                print("[오디오 재생 실패] 빈 오디오 데이터")
                return
            
            # 오디오 정규화
            # 오디오 pcm 값이 너무 크면 스피커에서 찢어지는 현상(클리핑) 방지지
            max_val = np.max(np.abs(audio_array))
            if max_val > 0:
                audio_array = audio_array.astype(np.float32) / max_val * 0.8
                audio_array = (audio_array * 32767).astype(np.int16)
            
            # 재생 전 안정화 지연 (0.2초)
            time.sleep(0.2)
            
            # 실시간 재생 (지연시간 제거)
            # 따로 파일 저장 없이 memory에 저장된 데이터를 재생 
            sd.play(audio_array, samplerate=sample_rate)
            sd.wait()
            
            # 재생 후 완전 종료 보장 (0.2초)
            time.sleep(0.2)
            
        except Exception as e:
            print(f"[오디오 스트림 재생 실패] {e}")
    
    def _play_beep(self, frequency: int = 800, duration: float = 0.3) -> None:
        """비프음 재생 (녹음 시작 알림)"""
        try:
            import sounddevice as sd
            import numpy as np
            
            # 비프음 생성
            sample_rate = 44100
            t = np.linspace(0, duration, int(sample_rate * duration), False)
            beep = np.sin(2 * np.pi * frequency * t) * 0.3  # 볼륨 조절
            
            # 16-bit 정수로 변환
            beep_int16 = (beep * 32767).astype(np.int16)
            
            # 재생
            sd.play(beep_int16, sample_rate)
            sd.wait()
            
        except Exception as e:
            print(f"[비프음 재생 실패] {e}")
    
    def _stream_tts_realtime(self, text: str) -> None:
        """실시간 TTS 스트리밍"""
        if not self.client:
            print(f"[TTS 대체] {text}")
            return
            
        try:
            print(f"[TTS 스트리밍 시작] {text}")
            self.is_playing = True # 재생 중 표시 
            
            # TTS 재생 전 안정화를 위한 지연 (0.4초)
            time.sleep(0.4)
            
            # TTS 스트림 생성 및 재생
            audio_data = self._create_tts_stream(text)
            if audio_data:
                self._play_audio_stream(audio_data)
                print(f"[TTS 스트리밍 완료] {text}")
            else:
                print(f"[TTS 스트림 생성 실패] {text}")
            
        except Exception as e:
            print(f"[TTS 스트리밍 실패] {e}")
        finally:
            self.is_playing = False
    
    def _record_audio_stream(self, duration: float = 5.0) -> Optional[bytes]:
        """실시간 오디오 녹음 스트림"""
        try:
            import sounddevice as sd
            import numpy as np
            
            print("말씀해주세요 (비프음 후 녹음 시작)...")
            
            sample_rate = 16000
            
            # 1. 먼저 비프음 재생 (녹음 시작 전)
            self._play_beep()
            
            # 2. 비프음 완료 후 짧은 지연
            time.sleep(0.2)
            
            # 3. 녹음 시작
            recording = sd.rec(int(duration * sample_rate), 
                             samplerate=sample_rate, 
                             channels=1, 
                             dtype=np.int16)
            
            # 4. 녹음 완료 대기
            sd.wait()
            
            return recording.tobytes()
            
        except Exception as e:
            print(f"[오디오 녹음 실패] {e}")
            return None
    
    # speach-to-text
    def _transcribe_audio_stream(self, audio_data: bytes) -> Optional[str]:
        """오디오 스트림을 텍스트로 변환"""
        if not self.client:
            return input("사용자 입력 > ").strip()
            
        try:
            # 임시 WAV 파일 생성
            wav_path = self.tmp_dir / "temp_stream.wav"
            
            # OpenAI 모델은 wav,mp3 파일을 지원하므로 pcm을 wave 라이브러리로 래핑 
            with wave.open(str(wav_path), 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(16000)
                wav_file.writeframes(audio_data)
            
            # STT 처리
            with open(wav_path, "rb") as f:
                transcript = self.client.audio.transcriptions.create(
                    model="gpt-4o-transcribe", # stt 최신 모델 
                    file=f,
                )
            
            # 임시 파일 삭제
            wav_path.unlink(missing_ok=True)
            
            return transcript.text.strip() if hasattr(transcript, 'text') else None
            
        except Exception as e:
            print(f"[STT 스트림 처리 실패] {e}")
            return None
    
    def _stream_llm_response(self, user_text: str) -> Generator[str, None, None]:
        """실시간 LLM 응답 스트리밍"""
        if not self.client:
            yield f"요청하신 내용에 대한 안내입니다: {user_text}"
            return
            
        try:
            # 메뉴 컨텍스트 가져오기
            menu_context = self._get_menu_context()
            
            # 시스템 프롬프트 구성 - 어르신 전용 음성 주문 시스템
            system_prompt = """당신은 어르신을 위한 친절한 AI 키오스크 음성 주문 시스템입니다. 

**중요한 역할:**
1. 어르신이 편안하게 주문할 수 있도록 도와드리세요
2. 천천히, 명확하게, 이해하기 쉽게 말씀해주세요
3. 항상 먼저 인사하고 주문을 도와드린다고 안내하세요
4. 메뉴 추천부터 주문 완료까지 단계별로 안내하세요

**대화 시작 방법:**
- "안녕하세요, 어르신! 오늘 어떤 메뉴를 드시고 싶으신가요?"
- "제가 메뉴 추천도 해드릴 수 있어요. 어떤 종류 음식을 좋아하세요?"

**주문 진행 방법:**
1. 먼저 어떤 종류의 음식을 원하는지 물어보세요 (버거, 샐러드, 음료 등)
2. 구체적인 메뉴를 추천해드리세요
3. 가격을 함께 안내해주세요
4. 추가 주문이 있는지 물어보세요
5. 주문 내역을 확인해주세요

**메뉴 정보:**
{menu_context}

**말투:**
- 존댓말을 사용하세요
- "어르신" 호칭을 자연스럽게 사용하세요  
- 천천히 또박또박 말하는 느낌으로 작성하세요
- 복잡한 설명보다는 간단명료하게 설명하세요

**예시 대화:**
사용자: (첫 대화)
AI: "안녕하세요 어르신! 저는 주문을 도와드리는 AI입니다. 오늘 어떤 메뉴를 드시고 싶으신가요? 버거, 샐러드, 음료 중에서 추천해드릴까요?"

사용자: "버거 먹고 싶어"
AI: "좋은 선택이세요! 저희 인기 버거 메뉴를 추천드릴게요. 불고기버거 11,900원이나 치킨버거 8,900원 어떠세요? 둘 다 맛있어요!"
""".format(menu_context=menu_context)
            
            # 스트리밍 응답 생성
            stream = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text},
                ],
                temperature=0,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield content
            
        except Exception as e:
            print(f"[LLM 스트리밍 실패] {e}")
            yield f"요청하신 내용에 대한 안내입니다: {user_text}"
    
    def _process_streaming_response(self, response_stream: Generator[str, None, None]) -> None:
        """스트리밍 응답을 실시간으로 처리하고 TTS로 변환"""
        if not self.client:
            return
            
        try:
            buffer = ""
            sentence_end_chars = ['.', '!', '?', '\n'] # 문장 끝 기준 
            current_tts_thread = None  # 현재 TTS 스레드만 추적
            
            for chunk in response_stream:
                buffer += chunk
                print(chunk, end="", flush=True)
                
                # 문장이 완성되면 즉시 TTS 재생
                if any(char in buffer for char in sentence_end_chars):
                    if buffer.strip():
                        # 이전 TTS가 완료될 때까지 대기
                        if current_tts_thread and current_tts_thread.is_alive():
                            current_tts_thread.join()
                        
                        # 문장 간 자연스러운 지연 추가 (0.8초)
                        time.sleep(0.8)
                        
                        # 별도 스레드에서 TTS 재생 (비동기)
                        current_tts_thread = threading.Thread(
                            target=self._stream_tts_realtime,
                            args=(buffer.strip(),),
                            daemon=True
                        )
                        current_tts_thread.start()
                    buffer = ""
            
            # 남은 텍스트 처리
            if buffer.strip():
                # 이전 TTS가 완료될 때까지 대기
                if current_tts_thread and current_tts_thread.is_alive():
                    current_tts_thread.join()
                
                # 마지막 문장도 지연 추가
                time.sleep(0.8)
                
                current_tts_thread = threading.Thread(
                    target=self._stream_tts_realtime,
                    args=(buffer.strip(),),
                    daemon=True
                )
                current_tts_thread.start()
            
            # 마지막 TTS 스레드가 완료될 때까지 대기
            if current_tts_thread and current_tts_thread.is_alive():
                current_tts_thread.join()
                
        except Exception as e:
            print(f"[스트리밍 응답 처리 실패] {e}")
    
    def _continuous_listening(self) -> Optional[str]:
        """연속 음성 인식 (더 자연스러운 대화)"""
        try:
            import sounddevice as sd
            import numpy as np
            
            # WebRTC VAD는 선택사항
            try:
                import webrtcvad
                vad = webrtcvad.Vad(2)  # 적당한 민감도
                use_vad = True
            except ImportError:
                print("webrtcvad가 설치되지 않아 기본 음성 인식 모드를 사용합니다.")
                use_vad = False
            
            print("연속 음성 인식 모드 (종료하려면 '그만'이라고 말씀하세요)...")
            sample_rate = 16000
            frame_duration = 30  # ms
            
            # 실시간 오디오 스트림
            def audio_callback(indata, frames, time, status):
                if status:
                    print(f"오디오 스트림 상태: {status}")
                
                # VAD로 음성 감지 (선택사항)
                audio_data = indata.tobytes()
                if use_vad:
                    is_speech = vad.is_speech(audio_data, sample_rate)
                else:
                    # 기본적으로 모든 오디오를 음성으로 간주
                    is_speech = True
                
                if is_speech:
                    # 음성 데이터 수집
                    self.audio_buffer.append(audio_data)
            
            # 오디오 스트림 시작
            with sd.InputStream(callback=audio_callback,
                              channels=1,
                              samplerate=sample_rate,
                              dtype=np.int16,
                              blocksize=int(sample_rate * frame_duration / 1000)):
                
                while True:
                    time.sleep(0.1)
                    
                    # 충분한 음성 데이터가 수집되면 STT 처리
                    if len(self.audio_buffer) >= 10:  # 약 3초
                        audio_data = b''.join(self.audio_buffer)
                        self.audio_buffer.clear()
                        
                        text = self._transcribe_audio_stream(audio_data)
                        if text:
                            return text
                    
                    # 종료 조건 확인 (키보드 입력)
                    if sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
                        return input().strip()
                        
        except Exception as e:
            print(f"[연속 음성 인식 실패] {e}")
            return None
    
    def run(self) -> None:
        """메인 실행 루프 - 어르신을 위한 음성 주문 시스템"""
        # 어르신을 위한 초기 인사말
        menu_count = len(self.menu_data.get('items', [])) if self.menu_data else 0
        initial_prompt = f"안녕하세요 어르신! 저는 주문을 도와드리는 AI입니다. 오늘 어떤 메뉴를 드시고 싶으신가요? 버거, 샐러드, 음료 중에서 추천해드릴까요?"
        print(f"[어르신 인사] {initial_prompt}")
        
        # 초기 프롬프트 재생 전 시스템 안정화를 위한 지연
        print("[시스템] 어르신을 위한 음성 주문 시스템을 준비하고 있습니다...")
        time.sleep(2.0)  # 2초 대기로 오디오 시스템 완전 초기화
        
        # 초기 프롬프트 재생 (한 번만)
        self._stream_tts_realtime(initial_prompt)
        
        # 초기 프롬프트 재생 완료 후 대기
        while self.is_playing:
            time.sleep(0.05)
        time.sleep(1.0)  # 추가 안정화 시간
        
        # 첫 번째 대화에서 AI가 먼저 질문하도록 설정
        first_interaction = True
        
        while True:
            try:
                # TTS 재생 중에는 사용자 입력을 받지 않음
                while self.is_playing:
                    time.sleep(0.05)
                
                # TTS 완전 종료 후 추가 안정화 시간 (1.5초)
                time.sleep(1.5)
                
                # 사용자 음성 입력 (스트리밍 방식)
                audio_data = self._record_audio_stream(duration=5.0)
                if audio_data:
                    user_text = self._transcribe_audio_stream(audio_data)
                else:
                    user_text = input("사용자 입력 > ").strip()
                
                # STT 결과 검증 및 필터링
                if not user_text or len(user_text.strip()) < 2:
                    print("(아무 말도 인식하지 못했습니다. 다시 시도합니다.)")
                    continue
                
                # 비프음이나 시스템음이 포함된 경우 필터링
                user_text = user_text.strip()
                if any(keyword in user_text.lower() for keyword in ['beep', '비프', '시스템', 'system']):
                    print("(시스템음이 감지되었습니다. 다시 시도합니다.)")
                    continue
                
                print(f"USER: {user_text}")
                
                # 종료 조건 확인
                if any(kw in user_text for kw in ["종료", "그만", "quit", "exit"]):
                    self._stream_tts_realtime("대화를 종료합니다.")
                    break
                
                # LLM 스트리밍 응답 및 실시간 TTS
                print("ASSISTANT: ", end="", flush=True)
                response_stream = self._stream_llm_response(user_text)
                
                # 실시간 처리 및 TTS 재생
                self._process_streaming_response(response_stream)
                
                # TTS 재생이 완전히 끝날 때까지 대기
                while self.is_playing:
                    time.sleep(0.05)
                
                # TTS 완전 종료 후 추가 안정화 시간 (2초)
                time.sleep(2.0)
                
            except KeyboardInterrupt:
                print("\n대화를 종료합니다.")
                break

def main() -> None:
    """메인 함수"""
    chat = VoiceChat()
    chat.run()

if __name__ == "__main__":
    main()
