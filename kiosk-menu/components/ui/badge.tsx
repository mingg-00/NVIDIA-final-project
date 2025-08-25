import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge 컴포넌트의 스타일 변형들을 정의하는 CVA 설정
 * 
 * 역할:
 * - 작은 정보 표시 태그들의 다양한 스타일을 정의
 * - 상태, 카테고리, 수량 등을 시각적으로 표현하는 UI 요소
 * - 일관된 크기와 패딩을 제공하여 정보 밀도 최적화
 * 
 * 기본 스타일:
 * - 인라인 플렉스 레이아웃으로 아이콘과 텍스트 정렬
 * - 작은 폰트 크기 (text-xs)와 적절한 패딩
 * - 둥근 모서리와 테두리 스타일
 * - 포커스 접근성과 호버 상태 지원
 * 
 * variant 옵션:
 * - default: 기본 프라이머리 색상 배지 (중요한 정보)
 * - secondary: 보조 색상 배지 (일반적인 정보)
 * - destructive: 경고/위험 색상 배지 (알레르기, 오류 등)
 * - outline: 테두리만 있는 투명 배지 (덜 중요한 정보)
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Badge 컴포넌트 - 작은 정보 표시 태그
 * 
 * 역할:
 * - 키오스크에서 다양한 정보를 간결하게 표시하는 UI 요소
 * - 메뉴의 특성, 상태, 수량 등을 시각적으로 구분
 * - 사용자가 중요한 정보를 빠르게 인식할 수 있도록 도움
 * - 아이콘과 텍스트를 함께 표시할 수 있는 유연한 레이아웃
 * 
 * 키오스크에서의 사용 예시:
 * - 장바구니 버튼의 아이템 개수 표시
 * - 메뉴 카테고리 표시 (비건, 채식, 일반)
 * - 알레르기 성분 표시 (빨간색 경고 배지)
 * - 조리 시간, 가격 정보 표시
 * - 메뉴 특성 (커스터마이징 가능, 신메뉴 등)
 * - 주문 상태 (준비중, 완료 등)
 * 
 * 스타일 활용 예시:
 * - default variant: 프로모션, 신메뉴, 추천 메뉴
 * - secondary variant: 일반 정보 (조리시간, 칼로리)
 * - destructive variant: 알레르기 경고, 품절 알림
 * - outline variant: 부가 정보 (태그, 카테고리)
 * 
 * Props:
 * - variant: 배지의 시각적 스타일 결정
 * - asChild: true일 경우 자식 컴포넌트로 렌더링 (Radix UI 패턴)
 * - className: 추가 CSS 클래스
 * - 기타 모든 표준 span HTML 속성들
 */
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
