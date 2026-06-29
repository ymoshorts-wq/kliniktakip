import { MainLayout } from './components/layout/MainLayout'
import { ServerSettingsModal } from './components/settings/ServerSettingsModal'
import { SettingsButton } from './components/settings/SettingsButton'
import { useNavigation } from './context/NavigationContext'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { PatientsPage } from './pages/PatientsPage'

function AppContent() {
  const { currentView } = useNavigation()

  switch (currentView) {
    case 'appointments':
      return <AppointmentsPage />
    default:
      return <PatientsPage />
  }
}

export default function App() {
  return (
    <MainLayout>
      <AppContent />
      <SettingsButton />
      <ServerSettingsModal />
    </MainLayout>
  )
}
