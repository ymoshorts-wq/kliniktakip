import { CalendarDays, Users } from 'lucide-react'
import {
	useNavigation,
	type AppView,
} from '../../context/NavigationContext'
import logo from '../../assets/logo.jpg'

const navItems: { label: string; view: AppView; icon: typeof Users }[] = [
  { label: 'Hastalar', view: 'patients', icon: Users },
  { label: 'Randevular', view: 'appointments', icon: CalendarDays },
]

export function Sidebar() {
  const { currentView, setCurrentView } = useNavigation()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="border-b border-slate-200 px-6 py-5">
				<div className="flex items-center justify-center">
					<img
						src={logo}
						alt="Klinik Logosu"
						className="h-10 w-auto object-contain"
					/>
				</div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ label, view, icon: Icon }) => (
          <button
            key={view}
            type="button"
            onClick={() => setCurrentView(view)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              currentView === view
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
