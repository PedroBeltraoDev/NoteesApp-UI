<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="logo">📝 NoteesApp</h1>
      <p class="subtitle">Digite a senha para acessar</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input 
            v-model="password" 
            type="password" 
            placeholder="Senha"
            class="input-field"
            ref="passwordInput"
            autofocus
          />
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

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

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}

.login-box {
  background: #2d2d2d;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo {
  font-size: 32px;
  margin: 0 0 8px 0;
  color: #ffffff;
}

.subtitle {
  color: #888;
  margin: 0 0 32px 0;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-field {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #444;
  border-radius: 10px;
  font-size: 16px;
  background: #1a1a1a;
  color: #fff;
  transition: all 0.2s;
  text-align: center;
  letter-spacing: 4px;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.btn-login {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-login:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  font-size: 14px;
  margin: 0;
}
</style>