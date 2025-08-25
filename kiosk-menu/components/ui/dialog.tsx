"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dialog 루트 컴포넌트 - 모달 다이얼로그의 최상위 컨테이너
 * 
 * 역할:
 * - Radix UI Dialog의 루트 컴포넌트를 래핑
 * - 모달 다이얼로그의 열기/닫기 상태를 관리
 * - 키보드 네비게이션 (ESC 키)와 접근성 기능을 자동으로 제공
 * 
 * 키오스크에서의 사용 예시:
 * - 메뉴 상세 정보 모달
 * - 비활성 상태 도움 팝업
 * - 음성 챗봇 모달
 * - 직원 호출 모달
 * - 알레르기/식단 설정 모달
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * DialogTrigger 컴포넌트 - 다이얼로그를 여는 트리거 요소
 * 
 * 역할:
 * - 클릭 시 다이얼로그를 여는 버튼이나 요소를 정의
 * - 접근성을 위해 자동으로 aria-expanded, aria-controls 속성 설정
 * - 키보드 접근성 (Enter, Space 키) 지원
 * 
 * 사용 예시:
 * - "상세보기" 버튼
 * - 메뉴 이미지 클릭
 * - "도움말" 버튼
 */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * DialogPortal 컴포넌트 - 다이얼로그를 DOM 트리의 다른 위치로 렌더링
 * 
 * 역할:
 * - React Portal을 사용하여 다이얼로그를 document.body에 렌더링
 * - z-index 스택 컨텍스트 문제를 방지
 * - 부모 컴포넌트의 overflow:hidden 등의 CSS 제약에서 벗어남
 * 
 * 사용 예시:
 * - 모든 모달 다이얼로그에서 자동으로 사용됨
 */
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/**
 * DialogClose 컴포넌트 - 다이얼로그를 닫는 요소
 * 
 * 역할:
 * - 클릭 시 다이얼로그를 닫는 버튼이나 요소
 * - ESC 키 이벤트와 동일한 동작 수행
 * - 모달 외부 클릭으로 닫기 동작과는 별개
 * 
 * 사용 예시:
 * - "닫기" 버튼
 * - "취소" 버튼
 * - X 아이콘 버튼
 */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * DialogOverlay 컴포넌트 - 다이얼로그 배경 오버레이
 * 
 * 역할:
 * - 다이얼로그 뒤의 반투명 배경을 제공
 * - 사용자의 시선을 모달 콘텐츠에 집중시킴
 * - 클릭 시 다이얼로그 닫기 기능 (기본값)
 * - 페이드 인/아웃 애니메이션 포함
 * 
 * 스타일링:
 * - 검은색 50% 투명도 배경
 * - 전체 화면 덮개 (fixed inset-0)
 * - 높은 z-index (z-50)로 다른 요소들 위에 표시
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * DialogContent 컴포넌트 - 다이얼로그의 메인 콘텐츠 컨테이너
 * 
 * 역할:
 * - 다이얼로그의 실제 콘텐츠가 들어가는 컨테이너
 * - 화면 중앙에 위치하며 반응형 크기 조절
 * - 줌 인/아웃과 페이드 애니메이션 포함
 * - 선택적으로 우상단 닫기 버튼 표시
 * 
 * 특징:
 * - 화면 중앙 정렬 (top: 50%, left: 50%, transform: translate(-50%, -50%))
 * - 모바일에서는 양쪽 여백 1rem, 데스크톱에서는 최대 너비 512px
 * - Grid 레이아웃으로 내부 요소들 간격 조절
 * - 키오스크 환경에 적합한 크기와 스타일링
 * 
 * Props:
 * - showCloseButton: 우상단 X 버튼 표시 여부 (기본값: true)
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * DialogHeader 컴포넌트 - 다이얼로그 상단 헤더 영역
 * 
 * 역할:
 * - 다이얼로그의 제목과 설명이 들어가는 헤더 영역
 * - DialogTitle과 DialogDescription을 포함
 * - 모바일에서는 중앙 정렬, 데스크톱에서는 좌측 정렬
 * 
 * 레이아웃:
 * - flexbox 세로 방향으로 제목과 설명 배치
 * - 요소들 간 적절한 간격 (gap-2) 제공
 * - 반응형 텍스트 정렬
 * 
 * 사용 예시:
 * - 메뉴 상세 정보 모달의 메뉴명과 설명
 * - 확인 다이얼로그의 제목과 메시지
 * - 설정 모달의 제목과 안내 문구
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

/**
 * DialogFooter 컴포넌트 - 다이얼로그 하단 푸터 영역
 * 
 * 역할:
 * - 다이얼로그의 액션 버튼들이 들어가는 하단 영역
 * - 확인, 취소, 닫기 등의 버튼들을 배치
 * - 모바일과 데스크톱에서 다른 레이아웃 제공
 * 
 * 레이아웃:
 * - 모바일: 세로 배치, 역순 (취소 버튼이 위, 확인 버튼이 아래)
 * - 데스크톱: 가로 배치, 우측 정렬 (취소, 확인 순서)
 * - 버튼들 간 적절한 간격 제공
 * 
 * 사용 예시:
 * - "닫기" 버튼
 * - "취소", "확인" 버튼 조합
 * - "이전", "다음" 내비게이션 버튼
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * DialogTitle 컴포넌트 - 다이얼로그 제목
 * 
 * 역할:
 * - 다이얼로그의 주요 제목을 표시
 * - 접근성을 위해 aria-labelledby로 자동 연결됨
 * - 스크린 리더가 다이얼로그 열 때 가장 먼저 읽는 텍스트
 * 
 * 스타일링:
 * - 큰 폰트 크기 (text-lg)
 * - 세미볼드 폰트 (font-semibold)
 * - 적절한 줄 높이 (leading-none)
 * 
 * 사용 예시:
 * - "치킨버거 상세 정보"
 * - "도움이 필요하신가요?"
 * - "알레르기 설정"
 * - "주문 완료"
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * DialogDescription 컴포넌트 - 다이얼로그 설명
 * 
 * 역할:
 * - 다이얼로그 제목 아래의 부가 설명이나 안내 메시지
 * - 접근성을 위해 aria-describedby로 자동 연결됨
 * - 사용자에게 추가 컨텍스트나 지침 제공
 * 
 * 스타일링:
 * - 작은 폰트 크기 (text-sm)
 * - 음소거된 색상 (text-muted-foreground)으로 시각적 계층 구조 형성
 * 
 * 사용 예시:
 * - "15초 동안 입력이 없었습니다. 도움을 받으시겠습니까?"
 * - "알레르기가 있는 성분을 선택하면 해당 메뉴를 제외합니다"
 * - "마이크 버튼을 눌러 음성으로 도움을 요청하세요"
 * - "주문이 성공적으로 접수되었습니다"
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
