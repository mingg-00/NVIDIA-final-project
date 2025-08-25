"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Volume2, Mic } from "lucide-react"

/**
 * 식단별 메뉴 분류 데이터
 * 
 * 역할:
 * - 각 메뉴가 어떤 식단 유형에 해당하는지 정의
 * - vegan: 완전 채식 메뉴 (동물성 원료 전혀 사용하지 않음)
 * - vegetarian: 일반 채식 메뉴 (유제품, 계란 등은 포함 가능)
 * - 메뉴 필터링과 식단 정보 표시에 사용
 */
const dietLists = {
  vegan: ["두부 단호박 샐러디", "두부 포케볼", "감자튀김", "콜라", "사이다"],
  vegetarian: ["두부 단호박 샐러디", "두부 포케볼", "감자튀김", "콜라", "사이다", "치즈스틱", "아이스크림", "팥빙수"],
}

/**
 * 메뉴별 알레르기 정보 매핑 데이터
 * 
 * 역할:
 * - 각 메뉴에 포함된 알레르기 유발 성분을 정의
 * - 알레르기 필터 기능에서 메뉴 제외 여부 판단에 사용
 * - 메뉴 상세 정보에서 알레르기 경고 표시에 사용
 * - 식품의약품안전처 알레르기 표시 의무 대상 식품 기준
 * - 빈 배열([])은 해당 메뉴에 알레르기 유발 성분이 없음을 의미
 */
const allergenMap = {
  "청양 통새우버거": ["달걀", "밀", "대두", "우유", "토마토", "새우", "조개류(굴)"],
  "치킨버거": ["달걀", "밀", "대두", "우유", "닭고기", "땅콩", "조개류(가리비)"],
  "데리버거": ["달걀", "밀", "대두", "우유", "닭고기", "조개류(가리비)"],
  "모짜렐라 버거": ["달걀", "밀", "대두", "우유", "쇠고기", "돼지고기"],
  "불고기버거": ["밀", "대두", "달걀", "우유", "토마토", "쇠고기"],
  "멕시칸 랩": ["달걀", "우유", "대두", "밀", "돼지고기", "쇠고기"],
  "연어 포케볼": ["대두", "밀", "연어"],
  "로스트 닭다리살 샐러디": ["우유", "대두", "밀", "토마토", "닭고기", "쇠고기"],
  "두부 단호박 샐러디": ["대두", "밀"],
  "두부 포케볼": ["대두", "호두"],
  "감자튀김": ["대두", "토마토"],
  "치즈스틱": ["밀", "대두", "달걀", "우유"],
  "콜라": [],
  "사이다": [],
  "아이스크림": ["우유", "밀", "대두"],
  "팥빙수": ["우유"],
}

/**
 * 알레르기 필터에서 선택 가능한 알레르기 항목 목록
 * 
 * 역할:
 * - 알레르기 설정 UI에서 버튼으로 표시될 항목들
 * - 사용자가 피해야 할 알레르기 성분을 선택할 수 있도록 함
 * - allergenMap에서 사용되는 알레르기 성분들의 부분집합
 * - 주요 알레르기 유발 성분만 선별하여 UI 복잡도 감소
 */
const allergenList = [
  "달걀",
  "토마토",
  "새우",
  "조개류(굴)",
  "조개류(가리비)",
  "닭고기",
  "땅콩",
  "쇠고기",
  "돼지고기",
  "호두",
]

/**
 * 메뉴 아이템의 타입 정의
 * 
 * 역할:
 * - 각 메뉴 아이템이 가져야 할 속성들을 정의
 * - TypeScript 타입 안전성을 위해 필수/선택 속성 분리
 * - 향후 데이터베이스 스키마 설계의 기초가 됨
 */
interface MenuItem {
  id: number                 // 고유 식별자
  name: string              // 메뉴명
  description: string       // 메뉴 설명
  price: number            // 가격 (원 단위)
  image: string            // 이미지 URL
  category: string         // 메인 카테골리 (메인, 사이드, 음료, 디저트)
  subcategory?: string     // 서브 카테고리 (버거, 랩, 보울, 샐러디)
  isVegan?: boolean        // 비건 메뉴 여부
  isVegetarian?: boolean   // 채식 메뉴 여부
  isAllergyFree?: boolean  // 알레르기 프리 메뉴 여부
  isCustomizable?: boolean // 커스터마이징 가능 여부
  cookingTime?: number     // 조리 시간 (분 단위)
  sodium?: number          // 나트륨 함량 (mg 단위)
}

/**
 * 장바구니 아이템의 타입 정의
 * 
 * 역할:
 * - 메뉴 아이템에 수량 정보를 추가한 타입
 * - 장바구니 상태 관리에 사용
 * - MenuItem의 모든 속성을 상속받으며 quantity 속성 추가
 */
interface CartItem extends MenuItem {
  quantity: number         // 장바구니에 담긴 개수
}

const menuItems: MenuItem[] = [
    // ========================================
  // 메뉴 데이터 정의 시작
  // ========================================
  // 버거 카테고리
  {
    id: 1,
    name: "청양 통새우버거",
    description: "매콤한 청양고추와 통새우가 들어간 프리미엄 버거",
    price: 12900,
    image: "/spicy-shrimp-burger.png",
    category: "메인",
    subcategory: "버거",
    isVegan: false,
    isAllergyFree: false,
    isCustomizable: true,
    cookingTime: 8,
    sodium: 850,
  },
  {
    id: 2,
    name: "치킨버거",
    description: "바삭한 치킨 패티와 신선한 야채가 들어간 클래식 버거",
    price: 8900,
    image: "/crispy-chicken-burger.png",
    category: "메인",
    subcategory: "버거",
    isVegan: false,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 6,
    sodium: 720,
  },
  {
    id: 3,
    name: "데리버거",
    description: "달콤한 데리야키 소스와 치킨 패티의 조화",
    price: 9500,
    image: "/teriyaki-chicken-burger.png",
    category: "메인",
    subcategory: "버거",
    isVegan: false,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 7,
    sodium: 680,
  },
  {
    id: 4,
    name: "모짜렐라 버거",
    description: "진짜 모짜렐라 치즈가 듬뿍 들어간 치즈 버거",
    price: 10500,
    image: "/melting-mozzarella-burger.png",
    category: "메인",
    subcategory: "버거",
    isVegan: false,
    isAllergyFree: false,
    isCustomizable: true,
    cookingTime: 7,
    sodium: 920,
  },
  {
    id: 5,
    name: "불고기버거",
    description: "한국식 불고기와 신선한 야채가 들어간 프리미엄 버거",
    price: 11900,
    image: "/korean-bulgogi-burger.png",
    category: "메인",
    subcategory: "버거",
    isVegan: false,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 8,
    sodium: 780,
  },
  // 랩 카테고리
  {
    id: 6,
    name: "멕시칸 랩",
    description: "매콤한 치킨과 아보카도, 살사소스가 들어간 멕시칸 스타일 랩",
    price: 8500,
    image: "/mexican-beef-pork-wrap.png",
    category: "메인",
    subcategory: "랩",
    isVegan: false,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 5,
    sodium: 650,
  },
  // 보울 카테고리
  {
    id: 7,
    name: "두부 포케볼",
    description: "신선한 두부와 각종 야채가 들어간 건강한 포케볼",
    price: 9900,
    image: "/tofu-poke-bowl.png",
    category: "메인",
    subcategory: "보울",
    isVegan: true,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 4,
    sodium: 420,
  },
  {
    id: 8,
    name: "연어 포케볼",
    description: "신선한 연어와 아보카도, 현미밥이 들어간 프리미엄 포케볼",
    price: 13900,
    image: "/salmon-poke-bowl.png",
    category: "메인",
    subcategory: "보울",
    isVegan: false,
    isAllergyFree: false,
    isCustomizable: true,
    cookingTime: 5,
    sodium: 580,
  },
  // 샐러디 카테고리
  {
    id: 9,
    name: "로스트 닭다리살 샐러디",
    description: "부드럽게 구운 닭다리살과 신선한 채소의 조화",
    price: 11500,
    image: "/roasted-chicken-salad.png",
    category: "메인",
    subcategory: "샐러디",
    isVegan: false,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 6,
    sodium: 520,
  },
  {
    id: 10,
    name: "두부 단호박 샐러디",
    description: "고소한 두부와 달콤한 단호박이 들어간 건강 샐러드",
    price: 9500,
    image: "/tofu-pumpkin-salad-bowl.png",
    category: "메인",
    subcategory: "샐러디",
    isVegan: true,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 3,
    sodium: 380,
  },
  // 사이드 메뉴
  {
    id: 11,
    name: "감자튀김",
    description: "바삭한 황금 감자튀김",
    price: 3500,
    image: "/golden-french-fries.png",
    category: "사이드",
    isVegan: true,
    isAllergyFree: true,
    isCustomizable: false,
    cookingTime: 4,
    sodium: 320,
  },
  {
    id: 12,
    name: "치즈스틱",
    description: "쫄깃한 모짜렐라 치즈스틱 5개",
    price: 4500,
    image: "/crispy-golden-mozzarella-sticks.png",
    category: "사이드",
    isVegan: false,
    isAllergyFree: false,
    isCustomizable: false,
    cookingTime: 5,
    sodium: 480,
  },
  // 음료
  {
    id: 13,
    name: "콜라",
    description: "시원한 콜라 500ml",
    price: 2000,
    image: "/refreshing-cola.png",
    category: "음료",
    isVegan: true,
    isAllergyFree: true,
    isCustomizable: false,
    cookingTime: 1,
    sodium: 15,
  },
  {
    id: 14,
    name: "사이다",
    description: "상쾌한 사이다 500ml",
    price: 2000,
    image: "/refreshing-sprite.png",
    category: "음료",
    isVegan: true,
    isAllergyFree: true,
    isCustomizable: false,
    cookingTime: 1,
    sodium: 20,
  },
  // 디저트
  {
    id: 15,
    name: "아이스크림",
    description: "부드럽고 달콤한 프리미엄 바닐라 아이스크림",
    price: 4500,
    image: "/vanilla-ice-cream.png",
    category: "디저트",
    isVegan: false,
    isAllergyFree: false,
    isCustomizable: false,
    cookingTime: 1,
    sodium: 45,
  },
  {
    id: 16,
    name: "팥빙수",
    description: "달콤한 팥과 부드러운 빙수의 완벽한 조화",
    price: 7500,
    image: "/patbingsu.png",
    category: "디저트",
    isVegan: true,
    isAllergyFree: true,
    isCustomizable: true,
    cookingTime: 3,
    sodium: 25,
  },
  // ========================================
  // 메뉴 데이터 정의 끝
  // ========================================
]

/**
 * 메뉴 카테고리 목록
 * 
 * 역할:
 * - 메뉴 화면 상단의 카테고리 탭에 표시
 * - 메뉴 필터링의 1차 분류 기준
 * - '전체'는 모든 카테고리 표시
 */
const categories = ["전체", "메인", "사이드", "음료", "디저트"]

/**
 * 메인 카테고리의 서브카테고리 목록
 * 
 * 역할:
 * - 메인 카테고리 선택 시에만 표시되는 2차 분류
 * - 메인 메뉴를 세부적으로 분류하여 검색 편의성 제공
 * - '전체'는 메인 카테고리의 모든 서브카테고리 표시
 */
const mainSubcategories = ["전체", "버거", "랩", "보울", "샐러디"]

/**
 * 키오스크 메뉴 메인 컴포넌트
 * 
 * 역할:
 * - 전체 키오스크 시스템의 중심 컴포넌트
 * - 주문 전 과정 (주문방식 선택 ~ 결제완료)을 관리
 * - 다양한 뷰 상태와 데이터를 중앙 집중식으로 관리
 * - 어르신 모드, 음성 인식, 알레르기 필터 등 다양한 기능 포함
 */
export default function KioskMenu() {
  // ========================================
  // 메인 상태 데이터
  // ========================================
  // 현재 화면 상태 관리
  const [currentView, setCurrentView] = useState<
    "orderType" | "menu" | "cart" | "payment" | "processing" | "completed"
  >("orderType")
  
  // 메뉴 탐색 관련 상태
  const [selectedCategory, setSelectedCategory] = useState<string>("메인")    // 선택된 메인 카테고리
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("버거") // 선택된 서브 카테고리
  
  // 주문 관련 상태
  const [cart, setCart] = useState<CartItem[]>([])                              // 장바구니 데이터
  const [orderType, setOrderType] = useState<"dineIn" | "takeOut" | null>(null) // 주문 방식 (매장/포장)
  const [specialRequests, setSpecialRequests] = useState("")                  // 특별 요청사항
  
  // 결제 관련 상태
  const [paymentStep, setPaymentStep] = useState<"method" | "processing" | "completed">("method") // 결제 단계
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")                 // 선택된 결제 방법
  const [orderNumber, setOrderNumber] = useState<string>("")                                     // 생성된 주문번호

  // ========================================
  // 메뉴 상세 정보 모달 상태
  // ========================================
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null) // 선택된 메뉴 아이템
  const [isMenuDetailOpen, setIsMenuDetailOpen] = useState(false)                // 메뉴 상세 모달 열기 상태

  // ========================================
  // 접근성 및 사용자 경험 설정
  // ========================================
  const [elderlyMode, setElderlyMode] = useState(true)                        // 어르신 모드 활성화 여부
  const [readAloud, setReadAloud] = useState(false)                           // 음성 읽기 기능 활성화 여부

  // ========================================
  // 필터 관련 상태
  // ========================================
  const [allergyFilter, setAllergyFilter] = useState<string[]>([])      // 선택된 알레르기 필터 목록
  const [dietFilter, setDietFilter] = useState<string>("일반")            // 선택된 식단 필터 ('일반', '채식', '비건')
  // const [preferredCategory, setPreferredCategory] = useState<string>("") // 선호 카테고리 (미사용)

  // ========================================
  // 음성 관련 상태
  // ========================================
  const [isListening, setIsListening] = useState(false)                        // 음성 인식 상태
  const [audioLevel, setAudioLevel] = useState(0)                             // 오디오 레벨 (0-100)
  const [showInactivityBanner, setShowInactivityBanner] = useState(false)     // 비활성 배너 표시 여부
  const [showTTSBanner, setShowTTSBanner] = useState(false)                   // TTS 배너 표시 여부
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null) // 비활성 타이머

  const [showInactivityPopup, setShowInactivityPopup] = useState(false)       // 비활성 도움 팝업 표시 여부

  const [isVoiceRecording, setIsVoiceRecording] = useState(false)             // 음성 녹음 상태

  const [showVoiceChatbot, setShowVoiceChatbot] = useState(false)             // 음성 챗봇 모달 표시 여부
  const [showStaffCall, setShowStaffCall] = useState(false)                   // 직원 호출 모달 표시 여부

  // ========================================
  // 얼굴 인식 및 API 관련 상태
  // ========================================
  const [faceRecognitionLoading, setFaceRecognitionLoading] = useState(false) // 얼굴 인식 진행 중 여부
  const [faceRecognitionResult, setFaceRecognitionResult] = useState<any>(null) // 얼굴 인식 결과
  const [showFaceRecognitionModal, setShowFaceRecognitionModal] = useState(false) // 얼굴 인식 결과 모달
  const [voiceChatActive, setVoiceChatActive] = useState(false) // 음성 챗봇 활성화 상태
  const [voiceChatPolling, setVoiceChatPolling] = useState<NodeJS.Timeout | null>(null) // 음성 챗봇 명령 폴링 타이머

  // ========================================
  // 설정 모달 상태
  // ========================================
  const [showAllergySettings, setShowAllergySettings] = useState(false)       // 알레르기 설정 모달 표시 여부
  const [showDietSettings, setShowDietSettings] = useState(false)             // 식단 설정 모달 표시 여부
  // const [showPreferredCategory, setShowPreferredCategory] = useState(false) // 선호 카테고리 모달 (미사용)

    /**
   * 메뉴 아이템에 식단 정보를 추가하는 함수
   * @param item - 기본 메뉴 아이템 객체
   * @returns 비건/채식 정보가 추가된 메뉴 아이템 객체
   * 
   * 역할:
   * - 하드코딩된 dietLists를 참조하여 메뉴의 식단 분류 확인
   * - 비건, 채식 여부를 boolean 값으로 추가
   * - 메뉴 상세 보기나 필터링에서 활용
   */
  const getMenuItemWithDietInfo = (item: MenuItem) => {
    const isVegan = dietLists.vegan.includes(item.name)
    const isVegetarian = dietLists.vegetarian.includes(item.name)
    return {
      ...item,
      isVegan,
      isVegetarian,
    }
  }

    /**
   * 메뉴 상세 정보 모달을 여는 함수
   * @param item - 상세 정보를 표시할 메뉴 아이템
   * 
   * 역할:
   * - 선택된 메뉴 아이템에 식단 정보를 추가하여 상태에 저장
   * - 메뉴 상세 모달 표시 상태를 true로 변경
   * - 사용자가 메뉴 이미지나 상세 버튼 클릭 시 호출
   */
  const openMenuDetail = (item: MenuItem) => {
    setSelectedMenuItem(getMenuItemWithDietInfo(item))
    setIsMenuDetailOpen(true)
  }

    /**
   * 메뉴 상세 모달에서 장바구니에 추가하는 함수
   * @param item - 장바구니에 추가할 메뉴 아이템
   * 
   * 역할:
   * - 메뉴 상세 모달에서 '장바구니에 담기' 버튼 클릭 시 실행
   * - addToCart 함수를 호출하여 아이템을 장바구니에 추가
   * - 추가 완료 후 상세 모달을 자동으로 닫음
   */
  const addToCartFromDetail = (item: MenuItem) => {
    addToCart(item)
    setIsMenuDetailOpen(false)
  }

    /**
   * 현재 선택된 필터 조건에 따라 메뉴 아이템을 필터링하는 계산된 값
   * 
   * 역할:
   * - 전체 menuItems에서 시작하여 단계별로 필터 적용
   * - 카테고리 필터: 선택된 카테고리에 맞는 아이템만 표시
   * - 서브카테고리 필터: 메인 카테고리일 때만 적용
   * - 알레르기 필터: 선택된 알레르기가 포함된 메뉴 제외
   * - 식단 필터: 비건/채식 옵션에 따라 필터링
   * - IIFE(Immediately Invoked Function Expression) 패턴 사용
   */
  const filteredItems = (() => {
    let items = menuItems

    if (selectedCategory !== "전체") {
      items = items.filter((item) => item.category === selectedCategory)
    }

    if (selectedCategory === "메인" && selectedSubcategory !== "전체") {
      items = items.filter((item) => item.subcategory === selectedSubcategory)
    }

    // 알레르기 필터 적용
    if (allergyFilter.length > 0) {
      items = items.filter((item) => {
        const itemAllergens: string[] = allergenMap[item.name as keyof typeof allergenMap] || []
        return !allergyFilter.some((allergen: string) => {
          return itemAllergens.includes(allergen)
        })
      })
    }

    // 식단 필터 적용
    if (dietFilter === "비건") {
      items = items.filter((item) => dietLists.vegan.includes(item.name))
    } else if (dietFilter === "채식") {
      items = items.filter((item) => dietLists.vegetarian.includes(item.name))
    }

    // if (preferredCategory && preferredCategory !== "전체") {
    //   items = items.filter((item) => item.category === preferredCategory)
    // }

    return items
  })()

    /**
   * 모든 메뉴 아이템의 참조
   * 
   * 역할:
   * - 어르신 모드에서 '전체 메뉴' 섹션에 표시될 데이터
   * - 필터링되지 않은 원본 메뉴 데이터를 유지
   * - 어르신들이 모든 메뉴를 볼 수 있도록 하는 용도
   */
  const allMenuItems = menuItems

    /**
   * 추천 메뉴 아이템 목록 (최대 4개)
   * 
   * 역할:
   * - 필터링된 아이템 중 첫 4개를 추천 메뉴로 선정
   * - 어르신 모드에서 '추천 (조건 일치)' 섹션에 표시
   * - 사용자의 알레르기/식단 설정에 맞는 메뉴를 우선 표시
   * - 어르신들이 쉬게 선택할 수 있도록 도움
   */
  const recommendedItems = filteredItems.slice(0, 4)

    /**
   * 메뉴 카테고리 변경을 처리하는 함수
   * @param category - 선택된 카테고리명
   * 
   * 역할:
   * - 사용자가 카테고리 버튼 클릭 시 실행
   * - 선택된 카테고리를 상태에 저장
   * - 서브카테고리를 '전체'로 초기화하여 필터 충돌 방지
   * - 메뉴 목록이 선택된 카테고리로 필터링됨
   */
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedSubcategory("전체")
  }

    /**
   * 메뉴 아이템을 장바구니에 추가하는 함수
   * @param item - 장바구니에 추가할 메뉴 아이템
   * 
   * 역할:
   * - 이미 장바구니에 있는 아이템인지 확인
   * - 기존 아이템이면 수량을 1 증가
   * - 새로운 아이템이면 수량 1로 장바구니에 추가
   * - 장바구니 상태를 불변성을 유지하며 업데이트
   */
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

    /**
   * 장바구니 아이템의 수량을 변경하는 함수
   * @param id - 수량을 변경할 메뉴 아이템의 ID
   * @param change - 수량 변경값 (양수: 증가, 음수: 감소)
   * 
   * 역할:
   * - 장바구니에서 +/- 버튼 클릭 시 실행
   * - 해당 ID의 아이템 수량을 change만큼 증감
   * - 수량이 0 이하가 되면 장바구니에서 자동 제거
   * - 불변성을 유지하며 장바구니 상태 업데이트
   */
  const updateQuantity = (id: number, change: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + change
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

    /**
   * 장바구니에서 특정 아이템을 완전히 제거하는 함수
   * @param id - 제거할 메뉴 아이템의 ID
   * 
   * 역할:
   * - 수량에 관계없이 해당 아이템을 장바구니에서 완전 제거
   * - 현재 구현에 버그가 있음 (item.id !== item.id는 항상 false)
   * - 올바른 구현: item.id !== id
   */
  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id)) // 버그 수정: item.id !== item.id는 항상 false
  }

    /**
   * 장바구니의 총 금액을 계산하는 함수
   * @returns 장바구니에 담긴 모든 아이템의 총 가격
   * 
   * 역할:
   * - 각 아이템의 (가격 × 수량)을 모두 합산
   * - 장바구니 페이지와 결제 페이지에서 총액 표시에 사용
   * - reduce 함수로 배열의 모든 요소를 순회하며 누적 계산
   */
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

    /**
   * 장바구니의 총 아이템 개수를 계산하는 함수
   * @returns 장바구니에 담긴 모든 아이템의 총 개수
   * 
   * 역할:
   * - 각 아이템의 수량을 모두 합산
   * - 헤더의 장바구니 버튼에 표시되는 숫자 배지에 사용
   * - 장바구니가 비어있으면 0, 아이템이 있으면 총 개수 반환
   */
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

    /**
   * 4자리 주문번호를 생성하는 함수
   * @returns 1000-9999 범위의 4자리 주문번호 문자열
   * 
   * 역할:
   * - 결제 완료 시 고객에게 제공할 주문번호 생성
   * - Math.random()을 사용하여 1000~9999 범위의 랜덤 숫자 생성
   * - 실제 운영 환경에서는 중복 방지 로직이 필요
   */
  const generateOrderNumber = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

    /**
   * 결제 처리를 시뮬레이션하는 함수 (현재 미사용)
   * @param paymentMethod - 선택된 결제 방법
   * 
   * 역할:
   * - 결제 처리 중 화면으로 전환
   * - 2초 후 결제 완료 화면으로 이동
   * - 주문번호 생성 및 설정
   * - 5초 후 모든 상태 초기화 및 첫 화면으로 복귀
   * - 실제 결제 연동 시 이 함수는 대체될 예정
   */
  const handlePayment = (paymentMethod: string) => {
    setCurrentView("processing")

    setTimeout(() => {
      const newOrderNumber = generateOrderNumber()
      setOrderNumber(newOrderNumber)
      setCurrentView("completed")

      setTimeout(() => {
        setCart([])
        setSpecialRequests("")
        setOrderType(null)
        setCurrentView("orderType")
        setSelectedCategory("전체")
        setSelectedSubcategory("전체")
      }, 5000)
    }, 2000)
  }

    /**
   * 주문 방식 선택 화면으로 돌아가는 함수
   * 
   * 역할:
   * - 헤더의 주문 방식 버튼 클릭 시 실행
   * - 현재 주문을 취소하고 처음부터 다시 시작
   * - 모든 주문 관련 상태를 초기화 (장바구니, 필터, 요청사항, 음성 챗봇 등)
   * - 주문 방식 선택 화면으로 화면 전환
   */
  const handleOrderTypeClick = () => {
    // 음성 챗봇 중지
    if (voiceChatActive) {
      fetch('http://localhost:8000/stop-voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => console.log('음성 챗봇 중지 중 오류:', error))
    }
    
    // 모든 상태 초기화
    setCurrentView("orderType")
    setCart([])
    setSpecialRequests("")
    setAllergyFilter([])
    setDietFilter("일반")
    setOrderType(null)
    setElderlyMode(true)  // 기본값을 어르신 모드로 설정 (처음 시작할 때)
    setVoiceChatActive(false)
    setFaceRecognitionResult(null)
    setShowFaceRecognitionModal(false)
  }

    /**
   * 모든 필터를 초기 상태로 되돌리는 함수
   * 
   * 역할:
   * - '필터 리셋' 버튼 클릭 시 실행
   * - 알레르기 필터를 빈 배열로 초기화
   * - 식단 필터를 '일반'으로 초기화
   * - 사용자가 필터 설정을 잘못했을 때 쉽게 초기화 가능
   */
  const resetFilters = () => {
    setAllergyFilter([])
    setDietFilter("일반")
    // setPreferredCategory("")
  }

    /**
   * 결제 방법 선택 및 결제 프로세스를 처리하는 함수
   * @param method - 선택된 결제 방법 ('card', 'cash', 'mobile', 'gift')
   * 
   * 역할:
   * - 결제 방법 선택 화면에서 결제 수단 클릭 시 실행
   * - 선택된 결제 방법을 상태에 저장
   * - 즉시 결제 처리 중 화면으로 전환
   * - 주문번호 생성 및 저장
   * - 2초 후 결제 완료 화면 표시
   * - 5초 후 모든 상태 초기화 및 첫 화면으로 복귀
   */
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method)
    setCurrentView("processing")

    // 주문번호 생성 (4자리 숫자)
    const newOrderNumber = Math.floor(1000 + Math.random() * 9000).toString()
    setOrderNumber(newOrderNumber)

    // 2초 후 결제 완료 화면으로 이동
    setTimeout(() => {
      setCurrentView("completed")

      // 5초 후 처음 화면으로 돌아가기
      setTimeout(() => {
        setCurrentView("orderType")
        setCart([])
        setSpecialRequests("")
        setOrderType(null)
        setSelectedPaymentMethod("")
        setOrderNumber("")
        resetFilters()
      }, 5000)
    }, 2000)
  }

  /**
   * 비활성 상태 감지 및 도움 제안 팝업을 처리하는 useEffect
   * 
   * 역할:
   * - 메뉴 화면에서만 동작하는 비활성 타이머 설정
   * - 15초간 사용자 입력이 없으면 도움 팝업 표시
   * - 단, 60세 이상 어르신이고 음성 챗봇이 활성화된 경우에는 팝업 표시하지 않음
   * - 클릭, 키보드, 터치 이벤트를 모두 모니터링
   * - 활동 감지 시 타이머 리셋
   * - 컴포넌트 언마운트 시 이벤트 리스너 정리
   * - currentView가 변경될 때마다 재설정
   */
  useEffect(() => {
    let timer: NodeJS.Timeout

    const resetTimer = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        // 60세 이상 어르신이고 음성 챗봇이 활성화된 경우 팝업 표시하지 않음
        if (elderlyMode && voiceChatActive) {
          console.log('[비활성 타이머] 어르신 음성 모드에서는 비활성 팝업을 표시하지 않습니다.')
          return
        }
        setShowInactivityPopup(true)
      }, 15000)
    }

    const handleActivity = () => {
      resetTimer()
    }

    if (currentView === "menu") {
      resetTimer()
      document.addEventListener("click", handleActivity)
      document.addEventListener("keypress", handleActivity)
      document.addEventListener("touchstart", handleActivity)
    }

    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener("click", handleActivity)
      document.removeEventListener("keypress", handleActivity)
      document.removeEventListener("touchstart", handleActivity)
    }
  }, [currentView, elderlyMode, voiceChatActive])

    /**
   * 알레르기 필터를 토글하는 함수
   * @param allergen - 토글할 알레르기 항목명
   * 
   * 역할:
   * - 알레르기 설정에서 특정 알레르기 버튼 클릭 시 실행
   * - 해당 알레르기가 이미 필터에 있으면 제거
   * - 필터에 없으면 추가
   * - 선택된 알레르기가 포함된 메뉴는 목록에서 제외됨
   */
  const toggleAllergyFilter = (allergen: string) => {
    setAllergyFilter((prev) => (prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]))
  }

    /**
   * 음성 녹음 상태를 토글하고 오디오 레벨 애니메이션을 제어하는 함수
   * 
   * 역할:
   * - 음성 입력 버튼 클릭 시 실행
   * - 녹음 상태를 on/off 토글
   * - 녹음 시작 시 3초간 랜덤 오디오 레벨 애니메이션 표시
   * - 실제 음성 인식 기능은 구현되지 않았고 UI 시뮬레이션만 제공
   * - 어르신 모드에서 하단 바의 오디오 레벨 표시에 사용
   */
  const toggleVoiceRecording = () => {
    setIsVoiceRecording(!isVoiceRecording)
    if (!isVoiceRecording) {
      // 음성인식 시작 시 3초간 레벨 애니메이션
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)

      setTimeout(() => {
        clearInterval(interval)
        setAudioLevel(0)
      }, 3000)
    }
  }

    /**
   * 음성 챗봇 모달을 표시하는 함수
   * 
   * 역할:
   * - 헤더의 '음성챗봇' 버튼이나 비활성 팝업에서 호출
   * - 음성 챗봇 모달을 화면에 표시
   * - 비활성 상태 팝업이 열려있다면 닫기
   * - 사용자가 음성으로 도움을 요청할 수 있는 인터페이스 제공
   */
  const handleVoiceChatbot = () => {
    setShowVoiceChatbot(true)
    setShowInactivityPopup(false)
  }

    /**
   * 직원 호출 기능을 처리하는 함수
   * 
   * 역할:
   * - 비활성 상태 팝업에서 '직원호출' 버튼 클릭 시 실행
   * - 비활성 팝업을 닫고 직원 호출 모달 표시
   * - 직원 호출 중임을 시각적으로 표시 (로딩 스피너)
   * - 5초 후 자동으로 직원 호출 완료 처리
   * - 모든 상태 초기화 후 주문 방식 선택 화면으로 복귀
   */
  const handleStaffCall = () => {
    setShowInactivityPopup(false)
    setShowStaffCall(true)

    // 5초 후 처음 화면으로 돌아가기
    setTimeout(() => {
      setShowStaffCall(false)
      setCurrentView("orderType")
      setCart([])
      setSpecialRequests("")
      setOrderType(null)
    }, 5000)
  }

    /**
   * 비활성 상태 팝업을 닫는 함수
   * 
   * 역할:
   * - 비활성 상태 팝업의 '닫기' 버튼 클릭 시 실행
   * - 사용자가 도움이 필요하지 않다고 응답할 때 사용
   * - 팝업을 닫고 기존 화면으로 돌아가 주문 진행 가능
   */
  const closeInactivityPopup = () => {
    setShowInactivityPopup(false)
  }

  /**
   * 음성 챗봇 명령을 처리하는 함수
   */
  const processVoiceChatCommand = (command: any) => {
    console.log('[음성 챗봇 명령]', command)
    
    switch (command.action) {
      case 'set_allergy':
        const allergens = command.data.allergens || []
        console.log('알레르기 필터 설정:', allergens)
        setAllergyFilter(allergens)
        setShowAllergySettings(true)
        setTimeout(() => setShowAllergySettings(false), 2000)
        break
        
      case 'set_diet':
        const dietType = command.data.diet_type || '일반'
        console.log('식단 필터 설정:', dietType)
        if (dietType === '비건') {
          setDietFilter('비건')
        } else if (dietType === '채식') {
          setDietFilter('채식')
        } else {
          setDietFilter('일반')
        }
        setShowDietSettings(true)
        setTimeout(() => setShowDietSettings(false), 2000)
        break
        
      case 'set_category':
        const category = command.data.category || '전체'
        console.log('카테고리 설정:', category)
        if (category === '메인') {
          setSelectedCategory('메인')
          setSelectedSubcategory('전체')
        } else if (category === '사이드') {
          setSelectedCategory('사이드')
        } else if (category === '음료') {
          setSelectedCategory('음료')
        } else if (category === '디저트') {
          setSelectedCategory('디저트')
        }
        // 카테고리 변경 알림
        setShowAllergySettings(true)
        setTimeout(() => setShowAllergySettings(false), 2000)
        break
        
      case 'set_subcategory':
        const subcategory = command.data.subcategory || '전체'
        console.log('서브카테고리 설정:', subcategory)
        setSelectedCategory('메인')
        setSelectedSubcategory(subcategory)
        // 서브카테고리 변경 알림
        setShowDietSettings(true)
        setTimeout(() => setShowDietSettings(false), 2000)
        break
        
      case 'add_to_cart':
        const menuName = command.data.menu_name
        const quantity = command.data.quantity || 1
        console.log('장바구니에 추가:', menuName, quantity)
        
        // 메뉴 찾기
        const menuItem = menuItems.find(item => 
          item.name === menuName || 
          item.name.includes(menuName) ||
          menuName.includes(item.name)
        )
        
        if (menuItem) {
          // 기존 장바구니 아이템 확인
          const existingItem = cart.find(cartItem => cartItem.id === menuItem.id)
          if (existingItem) {
            // 수량 업데이트
            setCart(prev => prev.map(item => 
              item.id === menuItem.id 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ))
          } else {
            // 새로 추가
            setCart(prev => [...prev, { ...menuItem, quantity }])
          }
          console.log(`${menuName} ${quantity}개가 장바구니에 추가되었습니다.`)
          // 장바구니 추가 성공 알림
          setShowAllergySettings(true)
          setTimeout(() => setShowAllergySettings(false), 2000)
        } else {
          console.log(`메뉴를 찾을 수 없습니다: ${menuName}`)
          // 메뉴 찾기 실패 알림
          setShowDietSettings(true)
          setTimeout(() => setShowDietSettings(false), 2000)
        }
        break
        
      case 'go_to_payment':
        console.log('결제 화면으로 이동')
        setCurrentView('payment')
        break
        
      default:
        console.log('알 수 없는 명령:', command.action)
    }
  }

  /**
   * 음성 챗봇 명령을 폴링하는 함수
   */
  const pollVoiceChatCommands = async () => {
    try {
      const response = await fetch('http://localhost:8000/voice-chat/commands', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.commands && result.commands.length > 0) {
          console.log('[음성 챗봇] 새로운 명령들:', result.commands.length)
          
          // 각 명령 처리
          result.commands.forEach((command: any) => {
            processVoiceChatCommand(command)
          })
        }
      }
    } catch (error) {
      console.error('[음성 챗봇 폴링 오류]', error)
    }
  }

  /**
   * 음성 챗봇 명령 폴링을 시작/중지하는 useEffect
   */
  useEffect(() => {
    if (voiceChatActive) {
      // 폴링 시작
      const timer = setInterval(pollVoiceChatCommands, 1000) // 1초마다 폴링
      setVoiceChatPolling(timer)
      console.log('[음성 챗봇] 명령 폴링 시작')
      
      return () => {
        if (timer) {
          clearInterval(timer)
          console.log('[음성 챗봇] 명령 폴링 중지')
        }
      }
    } else {
      // 폴링 중지
      if (voiceChatPolling) {
        clearInterval(voiceChatPolling)
        setVoiceChatPolling(null)
      }
    }
  }, [voiceChatActive])

  /**
   * 얼굴 인식 API를 호출하는 함수
   * 
   * 역할:
   * - FastAPI 서버의 /face-recognition 엔드포인트 호출
   * - 웹캠을 통해 얼굴을 인식하고 나이를 예측
   * - 60세 이상/미만 분류 결과 반환
   */
  const callFaceRecognitionAPI = async () => {
    try {
      setFaceRecognitionLoading(true)
      
      const response = await fetch('http://localhost:8000/face-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ camera_index: 0 })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result
      
    } catch (error) {
      console.error('얼굴 인식 API 호출 실패:', error)
      return {
        success: false,
        error_message: '얼굴 인식 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
      }
    } finally {
      setFaceRecognitionLoading(false)
    }
  }

  /**
   * 음성 챗봇 시작 API를 호출하는 함수
   * 
   * 역할:
   * - FastAPI 서버의 /start-voice-chat 엔드포인트 호출
   * - 60세 이상 사용자를 위한 음성 챗봇 세션 시작
   */
  const startVoiceChatAPI = async (orderType: "dineIn" | "takeOut") => {
    try {
      const response = await fetch('http://localhost:8000/start-voice-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_type: orderType })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result
      
    } catch (error) {
      console.error('음성 챗봇 시작 API 호출 실패:', error)
      return {
        success: false,
        message: '음성 챗봇 서버에 연결할 수 없습니다.'
      }
    }
  }

  /**
   * 주문 방식 선택 및 얼굴 인식 처리 함수
   * 
   * 역할:
   * - 먹고가기/포장 버튼 클릭 시 실행
   * - 얼굴 인식을 수행하여 나이 확인
   * - 60세 이상이면 어르신 모드 + 음성 챗봇 시작, 미만이면 일반 메뉴로 진행
   */
  const handleOrderTypeSelection = async (type: "dineIn" | "takeOut") => {
    setOrderType(type)
    
    // 얼굴 인식 시작
    setFaceRecognitionLoading(true)
    setShowFaceRecognitionModal(true)
    
    const result = await callFaceRecognitionAPI()
    setFaceRecognitionResult(result)
    
    if (result.success) {
      if (result.is_elderly) {
        // 디버깅용: 실제로는 60세 미만 사용자 - 어르신 모드 자동 활성화 + 음성 챗봇 시작
        console.log('디버깅 모드: 60세 미만 사용자 -> 어르신 모드 + 음성 챗봇 시작')
        
        // 어르신 모드 자동 활성화
        setElderlyMode(true)
        
        // 음성 챗봇 시작
        const voiceChatResult = await startVoiceChatAPI(type)
        
        setTimeout(() => {
          setShowFaceRecognitionModal(false)
          if (voiceChatResult.success) {
            // 음성 챗봇 시작 성공 - 어르신 모드 메뉴로 이동
            setVoiceChatActive(true)  // 음성 챗봇 활성화 상태 설정
            setCurrentView("menu")
            // 음성 챗봇 안내 표시
            alert("어르신을 위한 음성 주문 시스템이 시작되었습니다. 마이크에 대고 주문해주세요.")
          } else {
            // 음성 챗봇 시작 실패 - 어르신 모드 일반 메뉴로 진행
            setVoiceChatActive(false)
            setCurrentView("menu")
            alert("음성 주문 시스템 연결에 실패했습니다. 화면을 터치하여 주문해주세요.")
          }
        }, 2000)
      } else {
        // 디버깅용: 실제로는 60세 이상 사용자 - 일반 모드로 진행
        console.log('디버깅 모드: 60세 이상 사용자 -> 일반 메뉴로 진행')
        setElderlyMode(false)  // 일반 모드 설정
        setTimeout(() => {
          setShowFaceRecognitionModal(false)
          setCurrentView("menu")
        }, 2000)
      }
    } else {
      // 얼굴 인식 실패 - 에러 표시 후 일반 메뉴로 진행
      setElderlyMode(false)  // 기본값으로 일반 모드
      setTimeout(() => {
        setShowFaceRecognitionModal(false)
        setCurrentView("menu")
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {currentView === "menu" && orderType && (
              <Button
                onClick={handleOrderTypeClick}
                variant="outline"
                size="sm"
                className="text-sm font-medium bg-transparent"
              >
                {orderType === "dineIn" ? "매장" : "포장"}
              </Button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">키오스크 메뉴</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={() => setElderlyMode(!elderlyMode)} variant="outline" size="sm">
              {elderlyMode ? "일반모드" : "어르신모드"}
            </Button>

            <Button
              onClick={() => setShowVoiceChatbot(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Mic className="w-4 h-4" />
              <span>음성챗봇</span>
            </Button>

            {cart.length > 0 && (
              <Button onClick={() => setCurrentView("cart")} className="relative">
                장바구니 ({getTotalItems()})
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">{getTotalItems()}</Badge>
              </Button>
            )}
          </div>
        </div>
      </header>

      {currentView === "menu" && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowAllergySettings(!showAllergySettings)} variant="outline" size="sm">
                알레르기 설정
              </Button>

              <Button onClick={() => setShowDietSettings(!showDietSettings)} variant="outline" size="sm">
                식단 설정
              </Button>

              <Button onClick={resetFilters} variant="outline" size="sm">
                필터 리셋
              </Button>
            </div>

            {showAllergySettings && (
              <div className="mb-4 p-4 bg-white rounded-lg">
                <h3 className="font-medium mb-2">알레르기 설정</h3>
                <div className="flex flex-wrap gap-2">
                  {allergenList.map((allergen) => (
                    <Button
                      key={allergen}
                      onClick={() => toggleAllergyFilter(allergen)}
                      variant={allergyFilter.includes(allergen) ? "default" : "outline"}
                      size="sm"
                    >
                      {allergen}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {showDietSettings && (
              <div className="mb-4 p-4 bg-white rounded-lg">
                <h3 className="font-medium mb-2">식단 설정</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setDietFilter("일반")}
                    variant={dietFilter === "일반" ? "default" : "outline"}
                    size="sm"
                  >
                    일반
                  </Button>
                  <Button
                    onClick={() => setDietFilter("채식")}
                    variant={dietFilter === "채식" ? "default" : "outline"}
                    size="sm"
                  >
                    채식
                  </Button>
                  <Button
                    onClick={() => setDietFilter("비건")}
                    variant={dietFilter === "비건" ? "default" : "outline"}
                    size="sm"
                  >
                    비건
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === "cart" && (
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">장바구니</h1>
            <Button variant="outline" onClick={() => setCurrentView("menu")}>
              메뉴로 돌아가기
            </Button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">장바구니가 비어있습니다</p>
              <Button onClick={() => setCurrentView("menu")}>메뉴 보기</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 장바구니 아이템 목록 */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-gray-600">₩{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, -1)}>
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, 1)}>
                          +
                        </Button>
                      </div>
                      <p className="font-bold">₩{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 요청사항 입력 */}
              <Card className="p-4">
                <h3 className="font-bold mb-3">특별 요청사항</h3>
                <div className="flex space-x-2">
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="특별한 요청사항이 있으시면 입력해주세요"
                    className="flex-1 p-3 border rounded-md resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={() => setIsVoiceRecording(!isVoiceRecording)}
                    variant={isVoiceRecording ? "default" : "outline"}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isVoiceRecording ? "녹음중..." : "음성입력"}</span>
                  </Button>
                </div>
              </Card>

              {/* 총 금액 및 결제 버튼 */}
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold">총 금액</span>
                  <span className="text-xl font-bold text-blue-600">₩{getTotalPrice().toLocaleString()}</span>
                </div>
                <Button onClick={() => setCurrentView("payment")} className="w-full" size="lg">
                  결제하기
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}

      {selectedMenuItem && (
        <Dialog open={isMenuDetailOpen} onOpenChange={setIsMenuDetailOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedMenuItem.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={selectedMenuItem.image || "/placeholder.svg"}
                alt={selectedMenuItem.name}
                className="w-full h-48 object-cover rounded"
              />

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold mb-2">메뉴 설명</h4>
                  <p className="text-gray-600">{selectedMenuItem.description || "맛있는 메뉴입니다."}</p>
                </div>

                <div>
                  <h4 className="font-bold mb-2">가격</h4>
                  <p className="text-lg font-bold text-blue-600">₩{selectedMenuItem.price.toLocaleString()}</p>
                </div>

                <div>
                  <h4 className="font-bold mb-2">알레르기 정보</h4>
                  <div className="flex flex-wrap gap-1">
                    {allergenMap[selectedMenuItem.name as keyof typeof allergenMap]?.length > 0 ? (
                      allergenMap[selectedMenuItem.name as keyof typeof allergenMap].map((allergen) => (
                        <span key={allergen} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {allergen}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">알레르기 정보 없음</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-2">식단 정보</h4>
                  <div className="flex gap-2">
                    {selectedMenuItem.isVegan && (
                      <span className="px-2 py-1 bg-green-700 text-white text-xs rounded-full">비건</span>
                    )}
                    {selectedMenuItem.isVegetarian && !selectedMenuItem.isVegan && (
                      <span className="px-2 py-1 bg-lime-500 text-white text-xs rounded-full">채식</span>
                    )}
                    {!selectedMenuItem.isVegan && !selectedMenuItem.isVegetarian && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">일반</span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button onClick={() => addToCartFromDetail(selectedMenuItem)} className="flex-1">
                    장바구니에 담기
                  </Button>
                  <Button variant="outline" onClick={() => setIsMenuDetailOpen(false)}>
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showInactivityPopup && (
        <Dialog open={showInactivityPopup} onOpenChange={setShowInactivityPopup}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">도움이 필요하신가요?</DialogTitle>
              <DialogDescription className="text-center">
                15초 동안 입력이 없었습니다. 도움을 받으시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowInactivityPopup(false)
                  setShowVoiceChatbot(true)
                }}
                className="w-full"
              >
                음성챗봇 도움받기
              </Button>
              <Button onClick={handleStaffCall} variant="outline" className="w-full bg-transparent">
                직원호출
              </Button>
              <Button onClick={() => setShowInactivityPopup(false)} variant="outline" className="w-full">
                닫기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {showVoiceChatbot && (
        <Dialog open={showVoiceChatbot} onOpenChange={setShowVoiceChatbot}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">음성챗봇</DialogTitle>
              <DialogDescription className="text-center">
                마이크 버튼을 눌러 음성으로 도움을 요청하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={() => setIsVoiceRecording(!isVoiceRecording)}
                variant={isVoiceRecording ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-1"
              >
                <Mic className="w-4 h-4" />
                <span>{isVoiceRecording ? "음성 인식 중..." : "음성입력"}</span>
              </Button>
              <p className="text-sm text-gray-600">
                {isVoiceRecording ? "음성을 듣고 있습니다..." : "마이크 버튼을 눌러주세요"}
              </p>
              <Button onClick={() => setShowVoiceChatbot(false)} variant="outline" className="w-full">
                닫기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {showStaffCall && (
        <Dialog open={showStaffCall} onOpenChange={() => {}}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">직원 호출</DialogTitle>
              <DialogDescription className="text-center">직원을 호출 중입니다. 잠시만 기다려주세요.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 얼굴 인식 결과 모달 */}
      {showFaceRecognitionModal && (
        <Dialog open={showFaceRecognitionModal} onOpenChange={() => {}}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">얼굴 인식 진행 중</DialogTitle>
              <DialogDescription className="text-center">
                {faceRecognitionLoading 
                  ? "카메라로 얼굴을 인식하고 있습니다. 잠시만 기다려주세요."
                  : "얼굴 인식이 완료되었습니다."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4">
              {faceRecognitionLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              ) : faceRecognitionResult ? (
                <div className="text-center space-y-3">
                  {faceRecognitionResult.success ? (
                    <>
                      <div className="text-4xl mb-2">
                        {faceRecognitionResult.is_elderly ? "👴" : "🙂"}
                      </div>
                      <div className="text-lg font-semibold">
                        감지된 나이: {faceRecognitionResult.age}세
                      </div>
                      <div className="text-lg">
                        분류: <span className={faceRecognitionResult.is_elderly ? "text-blue-600 font-bold" : "text-gray-600"}>
                          {faceRecognitionResult.age_category}
                        </span>
                      </div>
                      
                      {faceRecognitionResult.is_elderly ? (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-blue-800 text-sm">
                            [디버깅 모드] 60세 미만 → 어르신 음성 주문 시스템을 시작합니다.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-700 text-sm">
                            [디버깅 모드] 60세 이상 → 일반 메뉴 화면으로 이동합니다.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">❌</div>
                      <div className="text-lg font-semibold text-red-600">얼굴 인식 실패</div>
                      <div className="text-sm text-gray-600">
                        {faceRecognitionResult.error_message || "얼굴을 인식할 수 없습니다."}
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          일반 메뉴 화면으로 이동합니다.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* TTS 안내 배너 */}
      {showTTSBanner && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <div className="flex items-center">
            <Volume2 className="w-5 h-5 mr-2" />
            <p>음성으로 메뉴를 읽어드리고 있습니다...</p>
          </div>
        </div>
      )}

      {/* 결제 방법 선택 */}
      {currentView === "payment" && (
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">결제 방법 선택</h1>
            <Button variant="outline" onClick={() => setCurrentView("cart")}>
              장바구니로 돌아가기
            </Button>
          </div>

          {/* 주문 요약 */}
          <Card className="p-4 mb-6">
            <h3 className="font-bold mb-3">주문 내역</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>₩{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>총 금액</span>
                <span className="text-primary">₩{getTotalPrice().toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* 결제 방법 선택 */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 text-lg">결제 방법을 선택하세요</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handlePaymentMethodSelect("card")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary hover:text-primary-foreground"
              >
                <div className="text-2xl">💳</div>
                <span className="font-medium">신용카드</span>
              </Button>

              <Button
                onClick={() => handlePaymentMethodSelect("cash")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary hover:text-primary-foreground"
              >
                <div className="text-2xl">💵</div>
                <span className="font-medium">현금</span>
              </Button>

              <Button
                onClick={() => handlePaymentMethodSelect("mobile")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary hover:text-primary-foreground"
              >
                <div className="text-2xl">📱</div>
                <span className="font-medium">모바일 결제</span>
              </Button>

              <Button
                onClick={() => handlePaymentMethodSelect("gift")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary hover:text-primary-foreground"
              >
                <div className="text-2xl">🎁</div>
                <span className="font-medium">상품권</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 결제 처리 중 */}
      {currentView === "processing" && (
        <div className="container mx-auto p-6 max-w-md">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">결제 처리 중</h2>
              <p className="text-gray-600">잠시만 기다려주세요...</p>
            </div>
            {selectedPaymentMethod && (
              <div className="text-sm text-gray-500">
                결제 방법:{" "}
                {selectedPaymentMethod === "card"
                  ? "신용카드"
                  : selectedPaymentMethod === "cash"
                    ? "현금"
                    : selectedPaymentMethod === "mobile"
                      ? "모바일 결제"
                      : selectedPaymentMethod === "gift"
                        ? "상품권"
                        : selectedPaymentMethod}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 결제 완료 */}
      {currentView === "completed" && (
        <div className="container mx-auto p-6 max-w-md">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2 text-green-600">결제 완료!</h2>
              <p className="text-gray-600 mb-4">주문이 성공적으로 접수되었습니다.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-600 mb-1">주문번호</div>
              <div className="text-2xl font-bold text-primary">{orderNumber}</div>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              <p>주문 유형: {orderType === "dineIn" ? "매장 식사" : "포장"}</p>
              <p>총 금액: ₩{getTotalPrice().toLocaleString()}</p>
            </div>

            <p className="text-sm text-gray-600">5초 후 자동으로 처음 화면으로 돌아갑니다.</p>
          </Card>
        </div>
      )}

      {currentView === "orderType" && (
        <div className="max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">주문 방식을 선택하세요</h2>

          <div className="space-y-4">
            <Button
              onClick={() => handleOrderTypeSelection("dineIn")}
              className="w-full h-16 text-lg"
              disabled={faceRecognitionLoading}
            >
              매장에서 식사
            </Button>

            <Button
              onClick={() => handleOrderTypeSelection("takeOut")}
              className="w-full h-16 text-lg"
              disabled={faceRecognitionLoading}
            >
              포장
            </Button>
          </div>
        </div>
      )}

      {currentView === "menu" && (
        <div className="max-w-7xl mx-auto p-6">
          {/* 카테고리 선택 */}
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => handleCategoryChange(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* 서브카테고리 선택 (메인 카테고리일 때만) */}
          {selectedCategory === "메인" && (
            <div className="flex space-x-2 mb-6 overflow-x-auto">
              {mainSubcategories.map((subcategory) => (
                <Button
                  key={subcategory}
                  onClick={() => setSelectedSubcategory(subcategory)}
                  variant={selectedSubcategory === subcategory ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {subcategory}
                </Button>
              ))}
            </div>
          )}

          <div className="pb-20">
            {/* 메뉴 목록 */}
            {elderlyMode ? (
              <div className="space-y-8">
                {recommendedItems.length > 0 && (
                  <div>
                    <h2 className="font-bold mb-4 text-green-600 text-2xl">추천 (조건 일치)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendedItems.map((item) => {
                        const menuItemWithDiet = getMenuItemWithDietInfo(item)
                        return (
                          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="flex">
                              <div className="flex-shrink-0 w-24 h-24 relative">
                                <img
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => openMenuDetail(item)}
                                />
                                <div className="absolute top-1 left-1 flex flex-col gap-1">
                                  {dietLists.vegan.includes(item.name) && (
                                    <span className="px-2 py-1 bg-green-700 text-white text-xs rounded-full">비건</span>
                                  )}
                                  {dietLists.vegetarian.includes(item.name) && !dietLists.vegan.includes(item.name) && (
                                    <span className="px-2 py-1 bg-lime-500 text-white text-xs rounded-full">채식</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 p-4">
                                <h3 className="font-bold mb-2 text-xl">{item.name}</h3>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.isCustomizable && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                      제외요청가능
                                    </span>
                                  )}
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                    {item.cookingTime}분
                                  </span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                    ₩{item.price.toLocaleString()}
                                  </span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                    나트륨 {item.sodium}mg
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <Button onClick={() => addToCart(item)} size="sm" className="flex-1">
                                    담기
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => openMenuDetail(item)}>
                                    상세
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="font-bold mb-4 text-2xl">전체 메뉴</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {allMenuItems.map((item) => {
                      const menuItemWithDiet = getMenuItemWithDietInfo(item)
                      return (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="flex">
                            <div className="flex-shrink-0 w-24 h-24 relative">
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => openMenuDetail(item)}
                              />
                              <div className="absolute top-1 left-1 flex flex-col gap-1">
                                {dietLists.vegan.includes(item.name) && (
                                  <span className="px-2 py-1 bg-green-700 text-white text-xs rounded-full">비건</span>
                                )}
                                {dietLists.vegetarian.includes(item.name) && !dietLists.vegan.includes(item.name) && (
                                  <span className="px-2 py-1 bg-lime-500 text-white text-xs rounded-full">채식</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 p-4">
                              <h3 className="font-bold mb-2 text-xl">{item.name}</h3>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.isCustomizable && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    제외요청가능
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                  {item.cookingTime}분
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                  ₩{item.price.toLocaleString()}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                  나트륨 {item.sodium}mg
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button onClick={() => addToCart(item)} size="sm" className="flex-1">
                                  담기
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openMenuDetail(item)}>
                                  상세
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // 메뉴 리스트 하단에 여백 추가하여 음성인식 바에 가려지지 않도록 함
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                {filteredItems.map((item) => {
                  const menuItemWithDiet = getMenuItemWithDietInfo(item)
                  return (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden relative">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openMenuDetail(item)}
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {dietLists.vegan.includes(item.name) && (
                            <span className="px-2 py-1 bg-green-700 text-white text-xs rounded-full">비건</span>
                          )}
                          {dietLists.vegetarian.includes(item.name) && !dietLists.vegan.includes(item.name) && (
                            <span className="px-2 py-1 bg-lime-500 text-white text-xs rounded-full">채식</span>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold mb-2">{item.name}</h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.isCustomizable && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              제외요청가능
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            {item.cookingTime}분
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            ₩{item.price.toLocaleString()}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            나트륨 {item.sodium}mg
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={() => addToCart(item)} size="sm" className="flex-1">
                            담기
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openMenuDetail(item)}>
                            상세
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {elderlyMode && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-gray-200 border-t p-4 shadow-lg">
              <div className="max-w-7xl mx-auto">
                {voiceChatActive ? (
                  // 음성 챗봇 활성화 상태
                  <div className="flex flex-col items-center space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg w-full text-center">
                      <p className="text-blue-800 font-medium text-lg">
                        🎙️ 음성 주문 시스템이 활성화되었습니다
                      </p>
                      <p className="text-blue-600 text-sm">
                        마이크에 대고 원하시는 메뉴를 말씀해주세요
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        onClick={toggleVoiceRecording}
                        variant={isVoiceRecording ? "default" : "outline"}
                        size="lg"
                        className="flex items-center space-x-2 px-8 py-4 text-lg"
                      >
                        <Mic className="w-6 h-6" />
                        <span>{isVoiceRecording ? "음성 인식 중..." : "음성으로 주문하기"}</span>
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setVoiceChatActive(false)
                          alert("음성 주문을 종료했습니다. 화면을 터치하여 주문하시거나 '음성으로 주문하기' 버튼을 눌러주세요.")
                        }}
                        variant="outline"
                        size="lg"
                        className="text-lg px-6 py-4"
                      >
                        음성 주문 종료
                      </Button>
                    </div>

                    {/* 데시벨 레벨바 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">음성 레벨:</span>
                      <div className="w-40 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // 일반 어르신 모드
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={() => {
                        setVoiceChatActive(true)
                        startVoiceChatAPI(orderType || "dineIn")
                        alert("음성 주문 시스템을 시작합니다.")
                      }}
                      variant="default"
                      size="lg"
                      className="flex items-center space-x-2 px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700"
                    >
                      <Mic className="w-6 h-6" />
                      <span>음성으로 주문하기</span>
                    </Button>

                    <Button
                      onClick={toggleVoiceRecording}
                      variant={isVoiceRecording ? "default" : "outline"}
                      size="lg"
                      className="flex items-center space-x-2 px-6 py-4 text-lg"
                    >
                      <Mic className="w-5 h-5" />
                      <span>{isVoiceRecording ? "음성 인식 중..." : "말하기"}</span>
                    </Button>

                    {/* 데시벨 레벨바 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">음성 레벨:</span>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
