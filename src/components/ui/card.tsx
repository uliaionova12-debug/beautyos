import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('bg-zinc-900 border border-zinc-800 rounded-2xl p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('text-sm font-medium text-zinc-400 uppercase tracking-wider mb-1', className)} {...props}>
      {children}
    </div>
  )
}
