import React from 'react'

const gaps = {
  xs: 'vc-gap-1',
  sm: 'vc-gap-2',
  md: 'vc-gap-3',
  lg: 'vc-gap-4',
} as const

type StackProps = {
  gap?: keyof typeof gaps
  className?: string
  children: React.ReactNode
}

export function Stack({ gap = 'sm', className = '', children }: StackProps) {
  return (
    <div className={`vc-flex vc-flex-col ${gaps[gap]} ${className}`}>
      {children}
    </div>
  )
}
