import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'
import { startKeepAlive } from './services/keepAlive'
import { checkStoredDemo } from './services/demo'
import { API_BASE_URL } from './services/http'

import './styles/variables.css'
import './styles/global.css'
import './styles/animations.css'
import './styles/ui.css'
import './styles/primevue-overrides.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import 'primeicons/primeicons.css'

import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import Card from 'primevue/card'
import Drawer from 'primevue/drawer'

// Aplica o tema antes de montar, para não piscar o tema errado
initTheme()

// Uma demo salva no navegador que já venceu: mostra o aviso de tempo esgotado em vez de um login sem explicação
checkStoredDemo()

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      // Os componentes do PrimeVue ficam escuros só quando o <html> tem .dark-mode (aplicado por useTheme)
      darkModeSelector: '.dark-mode',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)

app.component('PDialog', Dialog)
app.component('PToast', Toast)
app.component('PCard', Card)
app.component('PDrawer', Drawer)

app.mount('#app')

// Acorda a API já na abertura e a mantém acordada enquanto o app está em uso
startKeepAlive(API_BASE_URL)