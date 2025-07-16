import React from 'react'

import { LoaderPinwheel } from 'lucide-react'

interface LoadingIconProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const LoadingIcon = ({
  size = 'md',
  className = '',
  ...props
}: LoadingIconProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  return (
    <LoaderPinwheel
      className={`${sizeClasses[size]} animate-spin text-primary ${className}`}
      {...props}
    />
  )
}

export default LoadingIcon
