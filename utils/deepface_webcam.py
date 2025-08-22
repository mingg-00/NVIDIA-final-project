import cv2
from deepface import DeepFace


def capture_frame(camera_index=0):
	"""
	Capture a single frame from the local webcam.
	"""
	cap = cv2.VideoCapture(camera_index)
	if not cap.isOpened():
		raise RuntimeError("웹캠을 열 수 없습니다.")
	ret, frame = cap.read()
	cap.release()
	if not ret:
		raise RuntimeError("웹캠 프레임을 캡처하지 못했습니다.")
	return frame


def detect_main_face_bgr(frame_bgr):
	"""
	Detect faces using Haar cascade and return the largest face ROI and bbox.
	"""
	gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
	face_cascade = cv2.CascadeClassifier(
		cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
	)
	faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
	if len(faces) == 0:
		return None
	# pick the largest face
	x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
	return frame_bgr[y : y + h, x : x + w], (x, y, w, h)


def analyze_face_with_deepface(face_bgr):
	"""
	Run DeepFace age/gender analysis on a face ROI (BGR ndarray).
	"""
	face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
	result = DeepFace.analyze(
		img_path=face_rgb, actions=["age", "gender"], enforce_detection=False
	)
	if isinstance(result, (list, tuple)):
		res0 = result[0]
	else:
		res0 = result
	age = res0.get("age")
	gender = res0.get("gender") or res0.get("dominant_gender")
	return age, gender, res0


def get_predicted_age(camera_index=0, output_face_path=None):
	"""
	Capture from local webcam and return only the predicted age.
	If output_face_path is provided, save detected face ROI.
	Returns age (int/float) or None if not found.
	"""
	frame = capture_frame(camera_index)
	detection = detect_main_face_bgr(frame)
	if detection is None:
		return None
	face_roi, _ = detection
	if output_face_path:
		cv2.imwrite(output_face_path, face_roi)
	age, _gender, _allres = analyze_face_with_deepface(face_roi)
	return age


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


