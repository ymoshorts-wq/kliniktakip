import { Settings2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function SettingsButton() {
  const { openSettings } = useApp()

  return (
    <button
      type="button"
      onClick={openSettings}
      className="fixed bottom-20 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-lg backdrop-blur transition-all hover:scale-105 hover:border-sky-300 hover:text-sky-600 md:bottom-4"
      aria-label="Sunucu ayarları"
      title="Sunucu Ayarları"
    >
      <Settings2 className="h-4 w-4" />
    </button>
  )
}
