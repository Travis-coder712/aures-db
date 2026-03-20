import { useState, useEffect, useCallback } from 'react'

interface VersionInfo {
  current: string
  buildTime: string
  latest: string | null
  updateAvailable: boolean
  checking: boolean
  applyUpdate: () => void
}

const LIVE_VERSION_URL = 'https://travis-coder712.github.io/aures-db/data/metadata/version.json'
const CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes

export function useVersion(): VersionInfo {
  const [latest, setLatest] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkForUpdate() {
      // Don't check in dev mode
      if (import.meta.env.DEV) return

      setChecking(true)
      try {
        // Cache-bust to always get the latest version.json
        const res = await fetch(`${LIVE_VERSION_URL}?_=${Date.now()}`, {
          cache: 'no-store',
        })
        if (res.ok && mounted) {
          const data = await res.json()
          setLatest(data.version)
        }
      } catch {
        // Silently fail — user stays on current version
      } finally {
        if (mounted) setChecking(false)
      }
    }

    checkForUpdate()
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const current = __APP_VERSION__
  const updateAvailable = latest !== null && latest !== current

  const applyUpdate = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      window.location.reload()
      return
    }

    const reg = await navigator.serviceWorker.getRegistration()

    // Helper: tell a waiting SW to skip waiting and reload on activation
    function activateAndReload(sw: ServiceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      }, { once: true })
      sw.postMessage({ type: 'SKIP_WAITING' })
    }

    if (reg?.waiting) {
      activateAndReload(reg.waiting)
      return
    }

    // Force check for a new SW
    if (reg) {
      try {
        await reg.update()
        if (reg.waiting) {
          activateAndReload(reg.waiting)
          return
        }
      } catch {
        // update() failed — fall through to hard reload
      }
    }

    // No waiting worker — clear caches and do a hard reload
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    window.location.reload()
  }, [])

  return {
    current,
    buildTime: __BUILD_TIME__,
    latest,
    updateAvailable,
    checking,
    applyUpdate,
  }
}
