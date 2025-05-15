"use client"

import { useRouter as useNextRouter, type NextRouter } from "next/router"
import { useCallback } from "react"

// Define a type for the push options
interface NavigateOptions {
  scroll?: boolean
  shallow?: boolean
}

// Define a type for the Router object
export interface Router extends Omit<NextRouter, "push" | "replace"> {
  push(url: string, as?: string, options?: NavigateOptions): Promise<boolean>
  replace(url: string, as?: string, options?: NavigateOptions): Promise<boolean>
  back(): void
  forward(): void
  prefetch(url: string): Promise<void>
}

// Create a custom useRouter hook
export function useRouter(): Router {
  const nextRouter = useNextRouter()

  const push: Router["push"] = useCallback(
    (url, as, options) => {
      return nextRouter.push(url, as, options)
    },
    [nextRouter],
  )

  const replace: Router["replace"] = useCallback(
    (url, as, options) => {
      return nextRouter.replace(url, as, options)
    },
    [nextRouter],
  )

  const back: Router["back"] = useCallback(() => {
    nextRouter.back()
  }, [nextRouter])

  const forward: Router["forward"] = useCallback(() => {
    nextRouter.forward()
  }, [nextRouter])

  const prefetch: Router["prefetch"] = useCallback(
    (url) => {
      return nextRouter.prefetch(url)
    },
    [nextRouter],
  )

  return {
    ...nextRouter,
    push,
    replace,
    back,
    forward,
    prefetch,
  }
}

