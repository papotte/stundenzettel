import React from 'react'

import Image from 'next/image'

interface TimeWiseIconProps {
  className?: string
  style?: React.CSSProperties
}

const TimeWiseIcon: React.FC<TimeWiseIconProps> = ({ className, style }) => (
  <Image
    src="/favicon.png"
    alt="TimeWise Tracker Logo"
    className={className}
    style={style}
    width={128}
    height={128}
    draggable={false}
    decoding="async"
  />
)

export default TimeWiseIcon
