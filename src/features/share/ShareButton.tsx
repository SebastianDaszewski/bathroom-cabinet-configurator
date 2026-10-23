import { shareUrl } from '../../state/persistence'
import { useConfigurator } from '../../state/useConfigurator'

export function ShareButton({ title }: { title: string }) {
  const config = useConfigurator((state) => state.config)
  if (typeof navigator.share !== 'function') return null

  const share = async () => {
    try {
      await navigator.share({ title, url: shareUrl(config, window.location) })
    } catch {
      return
    }
  }

  return (
    <button type="button" className="button-secondary" onClick={share}>
      Udostępnij
    </button>
  )
}
