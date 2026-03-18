import React from 'react'

type DividerProps = {
  className?: string
}

export function Divider({ className = '' }: DividerProps) {
  return <div className={`vim-divider vc-border-b vc-border-gray-divider vc-my-6 ${className}`} />
}
