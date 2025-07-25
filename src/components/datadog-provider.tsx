"use client"

import { useEffect } from "react"
import { initDatadogRUM } from "@/lib/datadog-browser"

export function DatadogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initDatadogRUM()
  }, [])
  return <>{children}</>
} 