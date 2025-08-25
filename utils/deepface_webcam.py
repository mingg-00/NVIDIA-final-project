import cv2
import time
from deepface import DeepFace


def capture_frame(camera_index=0):
	"""
	Capture a single frame from the local webcam with improved black screen detection.
	"""
	# macOS에서 더 안정적인 카메라 백엔드 사용
	cap = cv2.VideoCapture(camera_index, cv2.CAP_AVFOUNDATION)
	if not cap.isOpened():
		print(f"[카메라 오류] AVFoundation으로 실패, 기본 백엔드 시도...")
		cap = cv2.VideoCapture(camera_index)
		if not cap.isOpened():
			print(f"[카메라 오류] 카메라 {camera_index}를 열 수 없습니다.")
			raise RuntimeError("웹캠을 열 수 없습니다.")
	
	# 카메라 설정 최적화
	cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
	cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
	cap.set(cv2.CAP_PROP_FPS, 30)
	cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # 버퍼 크기 최소화
	
	print(f"[카메라] 연결 성공, 워밍업 시작...")
	
	# 카메라 워밍업 - 더 긴 워밍업과 검은 화면 감지
	valid_frame = None
	for i in range(20):  # 5 -> 20으로 증가
		ret, frame = cap.read()
		if ret and frame is not None and frame.size > 0:
			# 검은 화면 감지 (평균 밝기 체크)
			gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
			mean_brightness = cv2.mean(gray)[0]
			print(f"[카메라] 워밍업 {i+1}/20 - 밝기: {mean_brightness:.1f}")
			
			if mean_brightness > 10:  # 검은 화면이 아닌 경우
				valid_frame = frame
				print(f"[카메라] 유효한 프레임 발견! (밝기: {mean_brightness:.1f})")
				break
		else:
			print(f"[카메라 오류] 워밍업 프레임 {i+1} 캡처 실패")
		
		time.sleep(0.1)  # 워밍업 간격
	
	# 최종 프레임 캡처 - 여러 번 시도
	final_frame = None
	if valid_frame is not None:
		final_frame = valid_frame
		print("[카메라] 워밍업에서 찾은 유효한 프레임 사용")
	else:
		print("[카메라] 워밍업에서 유효한 프레임을 찾지 못함, 추가 시도...")
		for attempt in range(10):
			ret, frame = cap.read()
			if ret and frame is not None and frame.size > 0:
				gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
				mean_brightness = cv2.mean(gray)[0]
				print(f"[카메라] 추가 시도 {attempt+1}/10 - 밝기: {mean_brightness:.1f}")
				
				if mean_brightness > 10:  # 유효한 프레임
					final_frame = frame
					print(f"[카메라] 유효한 프레임 획득! (밝기: {mean_brightness:.1f})")
					break
			time.sleep(0.2)
	
	cap.release()
	
	if final_frame is None:
		print("[카메라 오류] 유효한 프레임을 캐처할 수 없습니다 (검은 화면만 감지됨)")
		print("해결 방법:")
		print("1. 카메라 렌즈 덮개 확인")
		print("2. 충분한 조명 제공")
		print("3. 카메라 권한 확인 (시스템 설정 > 보안 및 개인정보보호 > 카메라)")
		print("4. 다른 앱에서 카메라 사용 중인지 확인")
		print("5. 시스템 재부팅 또는 카메라 드라이버 재설치")
		raise RuntimeError("유효한 프레임을 캡처할 수 없습니다 (검은 화면)")
	
	print(f"[카메라 성공] 최종 프레임 선택 완료: {final_frame.shape}")
	# 디버깅을 위해 캐처된 프레임 저장
	cv2.imwrite("debug_captured_frame.jpg", final_frame)
	print("[카메라] 디버깅용 프레임 저장: debug_captured_frame.jpg")
	
	return final_frame


def detect_main_face_bgr(frame_bgr):
	"""
	Detect faces using Haar cascade and return the largest face ROI and bbox.
	"""
	gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
	face_cascade = cv2.CascadeClassifier(
		cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
	)
	
	print(f"[얼굴 검출] 프레임 크기: {frame_bgr.shape}")
	
	# 더 관대한 얼굴 검출 파라미터
	faces = face_cascade.detectMultiScale(
		gray, 
		scaleFactor=1.1,  # 1.3 -> 1.1 (더 세밀한 검색)
		minNeighbors=3,   # 5 -> 3 (더 관대한 검출)
		minSize=(30, 30), # 최소 얼굴 크기
		maxSize=(300, 300) # 최대 얼굴 크기
	)
	
	print(f"[얼굴 검출] 검출된 얼굴 개수: {len(faces)}")
	
	if len(faces) == 0:
		# 더 관대한 파라미터로 재시도
		faces = face_cascade.detectMultiScale(
			gray,
			scaleFactor=1.05,  # 더욱 세밀
			minNeighbors=2,    # 더욱 관대
			minSize=(20, 20)   # 더 작은 얼굴도 검출
		)
		print(f"[얼굴 검출] 재시도 결과: {len(faces)}개 얼굴")
	
	if len(faces) == 0:
		print("[얼굴 검출] 얼굴을 찾을 수 없습니다.")
		return None
	
	# pick the largest face
	x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
	print(f"[얼굴 검출] 선택된 얼굴 위치: x={x}, y={y}, w={w}, h={h}")
	
	face_roi = frame_bgr[y : y + h, x : x + w]
	print(f"[얼굴 검출] 얼굴 ROI 크기: {face_roi.shape}")
	
	return face_roi, (x, y, w, h)


def analyze_face_with_deepface(face_bgr):
	"""
	Run DeepFace age/gender analysis on a face ROI (BGR ndarray).
	"""
	try:
		print(f"[DeepFace] 분석 시작 - 얼굴 크기: {face_bgr.shape}")
		
		face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
		
		# DeepFace 분석 - 더 관대한 설정
		result = DeepFace.analyze(
			img_path=face_rgb, 
			actions=["age", "gender"], 
			enforce_detection=False,  # 얼굴 검출 강제하지 않음
			silent=True  # 로그 출력 줄이기
		)
		
		print(f"[DeepFace] 분석 결과 타입: {type(result)}")
		
		if isinstance(result, (list, tuple)):
			res0 = result[0]
		else:
			res0 = result
		
		age = res0.get("age")
		gender = res0.get("gender") or res0.get("dominant_gender")
		
		print(f"[DeepFace] 분석 완료 - 나이: {age}, 성별: {gender}")
		
		return age, gender, res0
		
	except Exception as e:
		print(f"[DeepFace 오류] 얼굴 분석 실패: {e}")
		raise e


def get_predicted_age(camera_index=0, output_face_path=None):
	"""
	Capture from local webcam and return only the predicted age.
	If output_face_path is provided, save detected face ROI.
	Returns age (int/float) or None if not found.
	"""
	try:
		print(f"[나이 예측] 시작 - 카메라 인덱스: {camera_index}")
		
		# 1단계: 프레임 캡처
		frame = capture_frame(camera_index)
		
		# 2단계: 얼굴 검출
		detection = detect_main_face_bgr(frame)
		if detection is None:
			print("[나이 예측] 얼굴 검출 실패")
			return None
		
		face_roi, bbox = detection
		
		# 3단계: 얼굴 이미지 저장 (선택사항)
		if output_face_path:
			cv2.imwrite(output_face_path, face_roi)
			print(f"[나이 예측] 얼굴 이미지 저장: {output_face_path}")
		
		# 4단계: DeepFace로 나이 분석
		age, _gender, _allres = analyze_face_with_deepface(face_roi)
		
		print(f"[나이 예측] 최종 결과: {age}세")
		return age
		
	except Exception as e:
		print(f"[나이 예측 오류] 전체 프로세스 실패: {e}")
		import traceback
		traceback.print_exc()
		return None


def main(camera_index=0):
	"""
	Entry point that returns only the predicted age (prints nothing else).
	"""
	return get_predicted_age(camera_index=camera_index, output_face_path=None)


if __name__ == "__main__":
	try:
		main()
	except ImportError:
		print("DeepFace가 설치되어 있지 않습니다. 다음 명령으로 설치하세요:")
		print("pip install deepface")
	except Exception as e:
		print(f"오류: {e}")


