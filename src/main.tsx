import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './context/AppContext'
import { NavigationProvider } from './context/NavigationContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </AppProvider>
  </StrictMode>,
)
