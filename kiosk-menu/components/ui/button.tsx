import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button 컴포넌트의 스타일 변형들을 정의하는 CVA(Class Variance Authority) 설정
 * 
 * 역할:
 * - 다양한 버튼 스타일 (primary, destructive, outline 등)과 크기 (sm, default, lg 등)를 정의
 * - 접근성 (포커스, 비활성화 상태)과 다크모드를 지원하는 CSS 클래스들을 체계적으로 관리
 * - Tailwind CSS 클래스들을 조건부로 적용하여 일관된 디자인 시스템을 제공
 * 
 * variant 옵션:
 * - default: 기본 프라이머리 버튼 (파란색 배경)
 * - destructive: 위험한 액션용 빨간색 버튼 (삭제, 취소 등)
 * - outline: 테두리만 있는 투명 배경 버튼
 * - secondary: 보조 액션용 회색 버튼
 * - ghost: 배경 없는 투명 버튼 (호버 시에만 배경 표시)
 * - link: 링크 스타일 버튼 (밑줄과 함께)
 * 
 * size 옵션:
 * - sm: 작은 크기 (h-8)
 * - default: 기본 크기 (h-9)
 * - lg: 큰 크기 (h-10)
 * - icon: 아이콘 전용 정사각형 버튼 (size-9)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * 재사용 가능한 Button 컴포넌트
 * 
 * 역할:
 * - 키오스크 애플리케이션 전체에서 사용되는 일관된 버튼 UI를 제공
 * - 다양한 스타일과 크기 옵션을 지원하여 다양한 사용 사례에 대응
 * - 접근성 기능 (키보드 네비게이션, 스크린 리더 지원)을 내장
 * - Radix UI의 Slot을 사용하여 다른 컴포넌트로 렌더링 가능 (asChild prop)
 * 
 * 주요 사용 예시:
 * - 메뉴 카테고리 선택 버튼
 * - 장바구니 추가/제거 버튼
 * - 결제 방법 선택 버튼
 * - 모달 닫기/확인 버튼
 * 
 * Props:
 * - variant: 버튼의 시각적 스타일 결정
 * - size: 버튼의 크기 결정
 * - asChild: true일 경우 자식 컴포넌트로 렌더링 (Radix UI 패턴)
 * - className: 추가 CSS 클래스
 * - 기타 모든 표준 button HTML 속성들
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
