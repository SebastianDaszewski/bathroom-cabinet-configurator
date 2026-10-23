import { useEffect, useState } from 'react'
import { shareUrl } from '../../state/persistence'
import { useConfigurator } from '../../state/useConfigurator'

const COPIED_TIMEOUT = 2000

export function CopyLinkButton() {
  const config = useConfigurator((state) => state.config)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_TIMEOUT)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(config, window.location))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button type="button" className="button-secondary" onClick={copy}>
      <span aria-live="polite">{copied ? 'Link skopiowany' : 'Kopiuj link do projektu'}</span>
    </button>
  )
}
