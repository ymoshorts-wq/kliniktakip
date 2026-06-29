import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AppView = 'patients' | 'appointments'

interface NavigationContextValue {
  currentView: AppView
  setCurrentView: (view: AppView) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

const viewTitles: Record<AppView, string> = {
  patients: 'Hastalar',
  appointments: 'Randevular',
}

const viewDescriptions: Record<AppView, string> = {
  patients: 'Hasta kayıtlarını arayın, borç/ödeme hareketlerini yönetin',
  appointments: 'Randevuları doktor ve tarih bazında takip edin',
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<AppView>('patients')

  const value = useMemo(
    () => ({ currentView, setCurrentView }),
    [currentView],
  )

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}

export function getViewTitle(view: AppView) {
  return viewTitles[view]
}

export function getViewDescription(view: AppView) {
  return viewDescriptions[view]
}
