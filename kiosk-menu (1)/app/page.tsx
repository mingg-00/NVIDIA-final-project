"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Volume2, Mic } from "lucide-react"
import type SpeechRecognition from "speech-recognition"

const dietLists = {
  vegan: ["두부 단호박 샐러디", "두부 포케볼", "감자튀김", "콜라", "사이다"],
  vegetarian: ["두부 단호박 샐러디", "두부 포케볼", "감자튀김", "콜라", "사이다", "치즈스틱", "아이스크림", "팥빙수"],
}

const allergenMap = {
  "청양 통새우버거": ["달걀", "밀", "대두", "우유", "토마토", "새우", "조개류(굴)"],
  치킨버거: ["달걀", "밀", "대두", "우유", "닭고기", "땅콩", "조개류(가리비)"],
  데리버거: ["달걀", "밀", "대두", "우유", "닭고기", "조개류(가리비)"],
  "모짜렐라 버거": ["달걀", "밀", "대두", "우유", "쇠고기", "돼지고기"],
  불고기버거: ["밀", "대두", "달걀", "우유", "토마토", "쇠고기"],
  "멕시칸 랩": ["달걀", "우유", "대두", "밀", "돼지고기", "쇠고기"],
  "연어 포케볼": ["대두", "밀", "연어"],
  "로스트 닭다리살 샐러디": ["우유", "대두", "밀", "토마토", "닭고기", "쇠고기"],
  "두부 단호박 샐러디": ["대두", "밀"],
  "두부 포케볼": ["대두", "호두"],
  감자튀김: ["대두", "토마토"],
  치즈스틱: ["밀", "대두", "달걀", "우유"],
  콜라: [],
  사이다: [],
  아이스크림: ["우유", "밀", "대두"],
  팥빙수: ["우유"],
}

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

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
  subcategory?: string
  isVegan?: boolean
  isAllergyFree?: boolean
  isCustomizable?: boolean
  cookingTime?: number
  sodium?: number
}

interface CartItem extends MenuItem {
  quantity: number
}

const menuItems: MenuItem[] = [
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
]

const categories = ["전체", "메인", "사이드", "음료", "디저트"]
const mainSubcategories = ["전체", "버거", "랩", "보울", "샐러디"]

export default function KioskMenu() {
  const [currentView, setCurrentView] = useState<
    "orderType" | "menu" | "cart" | "payment" | "processing" | "completed"
  >("orderType")
  const [selectedCategory, setSelectedCategory] = useState<string>("전체")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("전체")
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<"dineIn" | "takeOut" | null>(null)
  const [specialRequests, setSpecialRequests] = useState("")
  const [paymentStep, setPaymentStep] = useState<"method" | "processing" | "completed">("method")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [orderNumber, setOrderNumber] = useState<string>("")

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [isMenuDetailOpen, setIsMenuDetailOpen] = useState(false)

  const [elderlyMode, setElderlyMode] = useState(true)
  const [readAloud, setReadAloud] = useState(false)

  const [largeText, setLargeText] = useState(false)

  // 필터 관련 상태
  const [allergyFilter, setAllergyFilter] = useState<string[]>([])
  const [dietFilter, setDietFilter] = useState<string>("일반")
  // const [preferredCategory, setPreferredCategory] = useState<string>("")

  // 음성 관련 상태
  const [isListening, setIsListening] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [showInactivityBanner, setShowInactivityBanner] = useState(false)
  const [showTTSBanner, setShowTTSBanner] = useState(false)
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null)

  const [showInactivityPopup, setShowInactivityPopup] = useState(false)

  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [showVoiceChatbot, setShowVoiceChatbot] = useState(false)

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [speechError, setSpeechError] = useState<string>("")

  const [showStaffCall, setShowStaffCall] = useState(false)

  const [showAllergySettings, setShowAllergySettings] = useState(false)
  const [showDietSettings, setShowDietSettings] = useState(false)
  // const [showPreferredCategory, setShowPreferredCategory] = useState(false)

  const [showVoiceAllergyCheck, setShowVoiceAllergyCheck] = useState(false)

  const [voiceResult, setVoiceResult] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)

  const getMenuItemWithDietInfo = (item: MenuItem) => {
    const isVegan = dietLists.vegan.includes(item.name)
    const isVegetarian = dietLists.vegetarian.includes(item.name)
    return {
      ...item,
      isVegan,
      isVegetarian,
    }
  }

  const detectAllergiesFromSpeech = (transcript: string) => {
    const detectedAllergies: string[] = []
    const lowerTranscript = transcript.toLowerCase()

    // 알레르기 키워드 매핑
    const allergyKeywords = {
      달걀: ["달걀", "계란", "에그"],
      토마토: ["토마토"],
      새우: ["새우", "쉬림프"],
      "조개류(굴)": ["굴", "조개", "굴조개"],
      "조개류(가리비)": ["가리비", "조개", "스캘럽"],
      닭고기: ["닭", "닭고기", "치킨"],
      땅콩: ["땅콩", "피넛"],
      쇠고기: ["소고기", "쇠고기", "비프"],
      돼지고기: ["돼지고기", "돼지", "포크"],
      호두: ["호두", "월넛"],
      밀: ["밀", "글루텐", "밀가루"],
      대두: ["대두", "콩", "두부"],
      우유: ["우유", "유제품", "밀크", "치즈"],
    }

    // 각 알레르기에 대해 키워드 검사
    Object.entries(allergyKeywords).forEach(([allergy, keywords]) => {
      if (keywords.some((keyword) => lowerTranscript.includes(keyword))) {
        detectedAllergies.push(allergy)
      }
    })

    return detectedAllergies
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false
        recognitionInstance.lang = "ko-KR"

        recognitionInstance.onstart = () => {
          console.log("[v0] Speech recognition started")
          setSpeechError("")
        }

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          console.log("[v0] Speech recognition result:", transcript)
          // Handle the speech result here
          alert(`음성 인식 결과: ${transcript}`)
        }

        recognitionInstance.onerror = (event) => {
          console.log("[v0] Speech recognition error:", event.error)
          setSpeechError(`음성 인식 오류: ${event.error}`)
          setIsVoiceRecording(false)

          // Handle specific error types
          switch (event.error) {
            case "no-speech":
              setSpeechError("음성이 감지되지 않았습니다. 다시 시도해주세요.")
              break
            case "audio-capture":
              setSpeechError("마이크에 접근할 수 없습니다.")
              break
            case "not-allowed":
              setSpeechError("마이크 권한이 거부되었습니다.")
              break
            default:
              setSpeechError(`음성 인식 오류: ${event.error}`)
          }
        }

        recognitionInstance.onend = () => {
          console.log("[v0] Speech recognition ended")
          setIsVoiceRecording(false)
        }

        setRecognition(recognitionInstance)
      } else {
        setSpeechError("이 브라우저는 음성 인식을 지원하지 않습니다.")
      }
    }
  }, [])

  const openMenuDetail = (item: MenuItem) => {
    setSelectedMenuItem(getMenuItemWithDietInfo(item))
    setIsMenuDetailOpen(true)
  }

  const addToCartFromDetail = (item: MenuItem) => {
    addToCart(item)
    setIsMenuDetailOpen(false)
  }

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
        const itemAllergens = allergenMap[item.name as keyof typeof allergenMap] || []
        return !allergyFilter.some((allergen) => itemAllergens.includes(allergen))
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

  const allMenuItems = menuItems

  const recommendedItems = filteredItems.slice(0, 4)

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedSubcategory("전체")
  }

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

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== item.id))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const generateOrderNumber = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

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

  const handleOrderTypeClick = () => {
    setCurrentView("orderType")
    setCart([])
    setSpecialRequests("")
    setAllergyFilter([])
    setDietFilter("일반")
    setOrderType(null)
  }

  const resetFilters = () => {
    setAllergyFilter([])
    setDietFilter("일반")
    // setPreferredCategory("")
  }

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

  const toggleVoiceRecording = () => {
    if (!recognition) {
      setSpeechError("음성 인식이 초기화되지 않았습니다.")
      return
    }

    if (isVoiceRecording) {
      recognition.stop()
      setIsVoiceRecording(false)
    } else {
      try {
        recognition.start()
        setIsVoiceRecording(true)
        setSpeechError("")

        // Start audio level animation
        const interval = setInterval(() => {
          setAudioLevel(Math.random() * 100)
        }, 100)

        setTimeout(() => {
          clearInterval(interval)
          setAudioLevel(0)
        }, 3000)
      } catch (error) {
        console.log("[v0] Error starting speech recognition:", error)
        setSpeechError("음성 인식을 시작할 수 없습니다.")
        setIsVoiceRecording(false)
      }
    }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout

    // 팝업 등장 시간
    const resetTimer = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
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
  }, [currentView])

  const toggleAllergyFilter = (allergen: string) => {
    setAllergyFilter((prev) => (prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]))
  }

  const handleVoiceChatbot = () => {
    setShowVoiceAllergyCheck(true)
    setShowInactivityPopup(false)
  }

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

  const closeInactivityPopup = () => {
    setShowInactivityPopup(false)
  }

  const startVoiceRecognition = () => {
    if (!recognition) {
      setSpeechError("음성 인식이 초기화되지 않았습니다.")
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      try {
        recognition.start()
        setIsRecording(true)
        setSpeechError("")
        setVoiceResult("")

        // Start audio level animation
        const interval = setInterval(() => {
          setAudioLevel(Math.random() * 100)
        }, 100)

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          console.log("[v0] Voice recognition result:", transcript)

          if (showVoiceAllergyCheck) {
            const detectedAllergies = detectAllergiesFromSpeech(transcript)
            console.log("[v0] Detected allergies:", detectedAllergies)

            if (detectedAllergies.length > 0) {
              // 감지된 알레르기를 필터에 추가
              setAllergyFilter((prev) => {
                const newFilters = [...prev]
                detectedAllergies.forEach((allergy) => {
                  if (!newFilters.includes(allergy)) {
                    newFilters.push(allergy)
                  }
                })
                return newFilters
              })

              setVoiceResult(`감지된 알레르기: ${detectedAllergies.join(", ")}`)
            } else {
              setVoiceResult("알레르기가 감지되지 않았습니다.")
            }
          }

          setIsRecording(false)
        }

        recognition.onerror = (event) => {
          console.log("[v0] Speech recognition error:", event.error)
          setSpeechError(`음성 인식 오류: ${event.error}`)
          setIsRecording(false)

          // Handle specific error types
          switch (event.error) {
            case "no-speech":
              setSpeechError("❌ 음성이 감지되지 않았습니다. 다시 시도해주세요.")
              break
            case "audio-capture":
              setSpeechError("❌ 마이크에 접근할 수 없습니다.")
              break
            case "not-allowed":
              setSpeechError("❌ 마이크 권한이 거부되었습니다.")
              break
            default:
              setSpeechError(`❌ 음성 인식 오류: ${event.error}`)
          }
        }

        recognition.onend = () => {
          console.log("[v0] Speech recognition ended")
          setIsRecording(false)
          clearInterval(interval)
          setAudioLevel(0)
        }

        setTimeout(() => {
          clearInterval(interval)
          setAudioLevel(0)
        }, 3000)
      } catch (error) {
        console.log("[v0] Error starting speech recognition:", error)
        setSpeechError("❌ 음성 인식을 시작할 수 없습니다.")
        setIsRecording(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">키오스크 메뉴</h1>
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
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setElderlyMode(!elderlyMode)} variant="outline" size="sm">
              {elderlyMode ? "🧑🏻일반모드" : "🧑🏻‍🦳어르신모드"}
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

              <Button onClick={() => setShowVoiceAllergyCheck(true)} variant="outline" size="sm">
                음성 알레르기 체크
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
                    {allergenMap[selectedMenuItem.name]?.length > 0 ? (
                      allergenMap[selectedMenuItem.name].map((allergen) => (
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
                onClick={toggleVoiceRecording}
                variant={isVoiceRecording ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-1"
                disabled={!recognition}
              >
                <Mic className="w-4 h-4" />
                <span>{isVoiceRecording ? "음성 인식 중..." : "음성입력"}</span>
              </Button>
              <p className="text-sm text-gray-600">
                {isVoiceRecording ? "음성을 듣고 있습니다..🔊" : "마이크 버튼을 눌러주세요"}
              </p>
              {speechError && <p className="text-sm text-red-500 text-center">{speechError}</p>}
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

            <p className="text-sm text-gray-600">잠시 후 처음 화면으로 돌아갑니다.</p>
          </Card>
        </div>
      )}

      {currentView === "orderType" && (
        <div className="max-w-4xl mx-auto p-6">
          <h2 className={`font-bold mb-8 text-center mt-4 ${largeText ? "text-4xl" : "text-2xl"}`}>
            주문 방식을 선택하세요
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary hover:scale-105"
              onClick={() => {
                setOrderType("dineIn")
                setCurrentView("menu")
              }}
            >
              <CardContent className={`text-center ${largeText ? "p-16" : "p-12"}`}>
                <div className={`mb-6 ${largeText ? "text-9xl" : "text-8xl"}`}>🍽️</div>
                <h3 className={`font-bold mb-2 ${largeText ? "text-4xl" : "text-3xl"}`}>매장</h3>
                <p className={`text-muted-foreground ${largeText ? "text-2xl" : "text-lg"}`}>매장 내에서 식사</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary hover:scale-105"
              onClick={() => {
                setOrderType("takeOut")
                setCurrentView("menu")
              }}
            >
              <CardContent className={`text-center ${largeText ? "p-16" : "p-12"}`}>
                <div className={`mb-6 ${largeText ? "text-9xl" : "text-8xl"}`}>🥡</div>
                <h3 className={`font-bold mb-2 ${largeText ? "text-4xl" : "text-3xl"}`}>포장</h3>
                <p className={`text-muted-foreground ${largeText ? "text-2xl" : "text-lg"}`}>테이크아웃으로 주문</p>
              </CardContent>
            </Card>
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
            <div className="fixed bottom-0 left-0 right-0 bg-white border-gray-200 border-t p-4">
              <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4">
                <Button
                  onClick={toggleVoiceRecording}
                  variant={isVoiceRecording ? "default" : "outline"}
                  size="lg"
                  className="flex items-center space-x-2"
                  disabled={!recognition}
                >
                  <Mic className="w-5 h-5" />
                  <span>{isVoiceRecording ? "음성 인식 중..." : "말하기"}</span>
                </Button>

                {speechError && <p className="text-sm text-red-500 text-center mt-2">{speechError}</p>}

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
            </div>
          )}
        </div>
      )}
      {showVoiceAllergyCheck && (
        <Dialog open={showVoiceAllergyCheck} onOpenChange={setShowVoiceAllergyCheck}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">음성 알레르기 체크</DialogTitle>
              <DialogDescription className="text-center">
                마이크 버튼을 눌러 알레르기 정보를 음성으로 확인하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={startVoiceRecognition}
                variant={isRecording ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-1"
                disabled={!recognition}
              >
                <Mic className="w-4 h-4" />
                <span>{isRecording ? "음성 인식 중..." : "음성입력"}</span>
              </Button>
              <p className="text-sm text-gray-600">
                {isRecording ? "음성을 듣고 있습니다...🔊" : "🎙️ 마이크 버튼을 눌러주세요"}
              </p>
              {speechError && <p className="text-sm text-red-500 text-center">{speechError}</p>}
              {voiceResult && <p className="text-sm text-blue-500 text-center">{voiceResult}</p>}
              <Button onClick={() => setShowVoiceAllergyCheck(false)} variant="outline" className="w-full">
                닫기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
