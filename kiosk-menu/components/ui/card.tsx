import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card 메인 컨테이너 컴포넌트
 * 
 * 역할:
 * - 콘텐츠를 시각적으로 그룹화하는 카드 UI의 기본 컨테이너
 * - 키오스크에서 메뉴 아이템, 장바구니 항목, 설정 패널 등을 표시하는 데 사용
 * - 일관된 그림자, 테두리, 배경색을 제공하여 콘텐츠를 구분
 * - 반응형 레이아웃을 지원하는 flexbox 기반 구조
 * 
 * 사용 예시:
 * - 메뉴 아이템 카드 (이미지, 제목, 가격, 버튼 포함)
 * - 장바구니 아이템 표시
 * - 결제 정보 요약 카드
 * - 주문 완료 정보 카드
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardHeader 컴포넌트 - 카드 상단 영역
 * 
 * 역할:
 * - 카드의 제목, 설명, 액션 버튼이 들어가는 헤더 영역
 * - CSS Grid를 사용하여 제목/설명과 액션 영역을 자동으로 배치
 * - CardTitle, CardDescription, CardAction과 함께 사용
 * - 컨테이너 쿼리를 지원하여 반응형 레이아웃 제공
 * 
 * 사용 예시:
 * - 메뉴 카드의 제목과 '장바구니 담기' 버튼 영역
 * - 설정 패널의 제목과 토글 스위치 영역
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardTitle 컴포넌트 - 카드 제목
 * 
 * 역할:
 * - 카드의 주요 제목을 표시하는 컴포넌트
 * - 시맨틱한 계층 구조를 제공하여 접근성 향상
 * - 일관된 타이포그래피 스타일 (세미볼드, 적절한 line-height)
 * 
 * 사용 예시:
 * - 메뉴 아이템명 (예: "치킨버거", "콜라")
 * - 설정 섹션 제목 (예: "알레르기 설정", "식단 설정")
 * - 페이지 섹션 제목 (예: "장바구니", "결제 방법 선택")
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * CardDescription 컴포넌트 - 카드 설명
 * 
 * 역할:
 * - 카드 제목 아래에 표시되는 부가 설명 텍스트
 * - 더 작은 폰트 크기와 muted 색상으로 시각적 계층 구조 형성
 * - 사용자에게 추가 컨텍스트나 상세 정보 제공
 * 
 * 사용 예시:
 * - 메뉴 아이템 설명 (예: "바삭한 치킨 패티와 신선한 야채가 들어간 클래식 버거")
 * - 설정 옵션 설명 (예: "알레르기가 있는 성분을 선택하면 해당 메뉴를 제외합니다")
 * - 단계별 안내 메시지
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * CardAction 컴포넌트 - 카드 액션 영역
 * 
 * 역할:
 * - 카드 헤더 우상단에 위치하는 액션 버튼이나 컨트롤 영역
 * - CSS Grid의 특정 위치(col-start-2, row-start-1)에 자동 배치
 * - 사용자가 카드에서 수행할 수 있는 주요 액션들을 담음
 * 
 * 사용 예시:
 * - 메뉴 카드의 '장바구니 담기' 버튼
 * - 장바구니 아이템의 수량 조절 버튼 (+/-)
 * - 설정 카드의 토글 스위치
 * - 더보기 메뉴 버튼 (⋯)
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * CardContent 컴포넌트 - 카드 본문 영역
 * 
 * 역할:
 * - 카드의 주요 콘텐츠가 들어가는 본문 영역
 * - 헤더와 푸터 사이의 메인 콘텐츠 공간
 * - 일관된 좌우 패딩(px-6)으로 정렬된 레이아웃 제공
 * 
 * 사용 예시:
 * - 메뉴 아이템의 상세 정보 (가격, 알레르기 정보, 영양 정보)
 * - 장바구니 아이템 목록
 * - 폼 필드들 (특별 요청사항 입력란 등)
 * - 이미지나 미디어 콘텐츠
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/**
 * CardFooter 컴포넌트 - 카드 하단 영역
 * 
 * 역할:
 * - 카드 하단에 위치하는 액션 버튼이나 부가 정보 영역
 * - flexbox를 사용하여 하단 요소들을 수평 정렬
 * - 카드의 주요 액션이나 요약 정보를 표시
 * 
 * 사용 예시:
 * - 메뉴 카드의 '상세보기', '장바구니 담기' 버튼들
 * - 장바구니의 '총 금액', '결제하기' 버튼
 * - 주문 요약의 '이전 단계', '다음 단계' 내비게이션
 * - 메타 정보 (작성일, 태그 등)
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
