import { CalendarDays, Users } from 'lucide-react'
import {
  useNavigation,
  type AppView,
} from '../../context/NavigationContext'

const navItems: { label: string; view: AppView; icon: typeof Users }[] = [
  { label: 'Hastalar', view: 'patients', icon: Users },
  { label: 'Randevular', view: 'appointments', icon: CalendarDays },
]

export function MobileNav() {
  const { currentView, setCurrentView } = useNavigation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ label, view, icon: Icon }) => (
          <button
            key={view}
            type="button"
            onClick={() => setCurrentView(view)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              currentView === view ? 'text-sky-600' : 'text-slate-500'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
