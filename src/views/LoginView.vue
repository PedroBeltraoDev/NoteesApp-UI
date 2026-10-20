<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="logo">
        <i class="pi pi-book"></i> NoteesApp
      </h1>
      <p class="subtitle">
        {{ isRegister ? 'Crie sua conta para começar' : 'Entre para acessar suas notas' }}
      </p>

      <form @submit.prevent="handleSubmit" class="login-form" novalidate>
        <div class="form-group">
          <input
            v-model="email"
            type="email"
            placeholder="E-mail"
            class="input-field"
            :class="{ invalid: fieldErrors.email }"
            autocomplete="email"
            maxlength="254"
            ref="emailInput"
            @input="clearFeedback"
          />
          <p v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</p>
        </div>

        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Senha"
            class="input-field"
            :class="{ invalid: fieldErrors.password }"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            maxlength="128"
            @input="clearFeedback"
          />
          <p v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</p>
        </div>

        <div v-if="isRegister" class="form-group">
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirmar senha"
            class="input-field"
            :class="{ invalid: fieldErrors.confirmPassword }"
            autocomplete="new-password"
            maxlength="128"
            @input="clearFeedback"
          />
          <p v-if="fieldErrors.confirmPassword" class="field-error">{{ fieldErrors.confirmPassword }}</p>
        </div>

        <p v-if="error" class="error-message" role="alert">{{ error }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ submitLabel }}
        </button>
      </form>

      <p class="switch-mode">
        {{ isRegister ? 'Já tem conta?' : 'Ainda não tem conta?' }}
        <button type="button" class="link-button" :disabled="loading" @click="toggleMode">
          {{ isRegister ? 'Entrar' : 'Criar conta' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/http'

const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const emailInput = ref<HTMLInputElement | null>(null)
const fieldErrors = reactive({ email: '', password: '', confirmPassword: '' })

const isRegister = computed(() => mode.value === 'register')
const submitLabel = computed(() => {
  if (loading.value) return isRegister.value ? 'Criando conta...' : 'Entrando...'
  return isRegister.value ? 'Criar conta' : 'Entrar'
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clearFeedback = () => {
  error.value = ''
  fieldErrors.email = ''
  fieldErrors.password = ''
  fieldErrors.confirmPassword = ''
}

const validate = () => {
  clearFeedback()

  if (!email.value.trim()) fieldErrors.email = 'Digite seu e-mail'
  else if (!EMAIL_PATTERN.test(email.value.trim())) fieldErrors.email = 'E-mail inválido'

  if (!password.value) fieldErrors.password = 'Digite sua senha'
  else if (isRegister.value && password.value.length < 8) fieldErrors.password = 'A senha deve ter pelo menos 8 caracteres'

  if (isRegister.value && password.value && confirmPassword.value !== password.value) {
    fieldErrors.confirmPassword = 'As senhas não conferem'
  }

  return !fieldErrors.email && !fieldErrors.password && !fieldErrors.confirmPassword
}

// Erros de validação do servidor chegam como { Email: [...], Password: [...] }
const applyServerErrors = (apiError: ApiError) => {
  const pick = (key: string) => apiError.errors[key]?.[0] ?? apiError.errors[key.toLowerCase()]?.[0] ?? ''

  fieldErrors.email = pick('Email')
  fieldErrors.password = pick('Password')

  if (!fieldErrors.email && !fieldErrors.password) error.value = apiError.message
}

const handleSubmit = async () => {
  if (loading.value || !validate()) return

  loading.value = true

  try {
    const normalizedEmail = email.value.trim()

    if (isRegister.value) await authService.register(normalizedEmail, password.value)
    else await authService.login(normalizedEmail, password.value)

    await router.push('/')
  } catch (e) {
    if (!(e instanceof ApiError)) {
      error.value = 'Algo deu errado. Tente novamente.'
    } else if (e.status === 400) {
      applyServerErrors(e)
    } else if (e.status === 429) {
      error.value = 'Muitas tentativas. Aguarde um minuto e tente novamente.'
    } else {
      // 401 (e-mail ou senha inválidos), 409 (e-mail já cadastrado), rede fora, 5xx...
      error.value = e.message
    }

    password.value = ''
    confirmPassword.value = ''
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  mode.value = isRegister.value ? 'login' : 'register'
  password.value = ''
  confirmPassword.value = ''
  clearFeedback()
}

onMounted(() => {
  emailInput.value?.focus()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  padding: 16px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.logo .pi-book {
  font-size: 36px;
  color: #3b82f6;
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

.form-group {
  text-align: left;
}

.input-field {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 18px;
  border: 2px solid #444;
  border-radius: 10px;
  font-size: 16px;
  background: #1a1a1a;
  color: #fff;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.input-field.invalid {
  border-color: #dc2626;
}

.field-error {
  color: #f87171;
  font-size: 13px;
  margin: 6px 4px 0;
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
  color: #f87171;
  font-size: 14px;
  margin: 0;
}

.switch-mode {
  color: #888;
  font-size: 14px;
  margin: 24px 0 0;
}

.link-button {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.link-button:hover:not(:disabled) {
  text-decoration: underline;
}
</style>
