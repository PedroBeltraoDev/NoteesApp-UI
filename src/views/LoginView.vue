<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const error = ref('')
const loading = ref(false)
const passwordInput = ref<HTMLInputElement | null>(null)

const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '1234'

const handleLogin = async () => {
  if (!password.value.trim()) {
    error.value = 'Digite a senha'
    return
  }
  
  loading.value = true
  error.value = ''
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (password.value === CORRECT_PASSWORD) {
    localStorage.setItem('noteesapp_auth', 'true')
    localStorage.setItem('noteesapp_auth_time', Date.now().toString())
    router.push('/')
  } else {
    error.value = 'Senha incorreta'
    password.value = ''
    passwordInput.value?.focus()
  }
  
  loading.value = false
}

onMounted(() => {
  passwordInput.value?.focus()
})
</script>