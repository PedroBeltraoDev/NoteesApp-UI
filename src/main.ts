import { createApp } from 'vue'
import App from './App.vue'
import router from './router'


import './styles/variables.css'
import './styles/global.css'
import './styles/animations.css'
import './styles/primevue-overrides.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import 'primeicons/primeicons.css'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'  
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import Card from 'primevue/card'
import Drawer from 'primevue/drawer'

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'body',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)

app.component('Textarea', Textarea)
app.component('PTextarea', Textarea)
app.component('PButton', Button)
app.component('PInputText', InputText)
app.component('PSelect', Select)
app.component('PDialog', Dialog)
app.component('PToast', Toast)
app.component('PCard', Card)
app.component('PDrawer', Drawer)

app.mount('#app')