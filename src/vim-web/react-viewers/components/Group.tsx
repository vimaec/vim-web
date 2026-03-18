import React from 'react'

const gaps = {
  xs: 'vc-gap-1',
  sm: 'vc-gap-2',
  md: 'vc-gap-3',
  lg: 'vc-gap-4',
} as const

const aligns = {
  start: 'vc-items-start',
  center: 'vc-items-center',
  end: 'vc-items-end',
  stretch: 'vc-items-stretch',
} as const

const justifies = {
  start: 'vc-justify-start',
  center: 'vc-justify-center',
  end: 'vc-justify-end',
  between: 'vc-justify-between',
} as const

type GroupProps = {
  gap?: keyof typeof gaps
  align?: keyof typeof aligns
  justify?: keyof typeof justifies
  wrap?: boolean
  className?: string
  children: React.ReactNode
}

export function Group({
  gap = 'sm',
  align = 'center',
  justify = 'start',
  wrap,
  className = '',
  children,
}: GroupProps) {
  return (
    <div
      className={`vc-flex ${gaps[gap]} ${aligns[align]} ${justifies[justify]} ${wrap ? 'vc-flex-wrap' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
