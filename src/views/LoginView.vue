<template>
  <div class="login-container">
    <main class="login-box">
      <h1 class="brand">
        <AppLogo :size="52" wordmark />
      </h1>
      <p class="subtitle">
        {{ isRegister ? 'Crie sua conta para começar' : 'Entre para acessar suas notas' }}
      </p>

      <form @submit.prevent="handleSubmit" class="login-form" novalidate>
        <div class="form-group">
          <label for="login-email" class="field-label">E-mail</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            placeholder="voce@exemplo.com"
            class="input-field"
            :class="{ invalid: fieldErrors.email }"
            :aria-invalid="!!fieldErrors.email"
            :aria-describedby="fieldErrors.email ? 'login-email-error' : undefined"
            autocomplete="email"
            maxlength="254"
            ref="emailInput"
            @input="clearFeedback"
          />
          <p v-if="fieldErrors.email" id="login-email-error" class="field-error" role="alert">{{ fieldErrors.email }}</p>
        </div>

        <div class="form-group">
          <label for="login-password" class="field-label">Senha</label>
          <div class="password-wrapper">
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="isRegister ? 'Mínimo de 8 caracteres' : 'Sua senha'"
              class="input-field has-toggle"
              :class="{ invalid: fieldErrors.password }"
              :aria-invalid="!!fieldErrors.password"
              :aria-describedby="fieldErrors.password ? 'login-password-error' : undefined"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              maxlength="128"
              @input="clearFeedback"
            />
            <button
              type="button"
              class="toggle-password"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true"></i>
            </button>
          </div>
          <p v-if="fieldErrors.password" id="login-password-error" class="field-error" role="alert">{{ fieldErrors.password }}</p>
        </div>

        <div v-if="isRegister" class="form-group">
          <label for="login-confirm" class="field-label">Confirmar senha</label>
          <input
            id="login-confirm"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Repita a senha"
            class="input-field"
            :class="{ invalid: fieldErrors.confirmPassword }"
            :aria-invalid="!!fieldErrors.confirmPassword"
            :aria-describedby="fieldErrors.confirmPassword ? 'login-confirm-error' : undefined"
            autocomplete="new-password"
            maxlength="128"
            @input="clearFeedback"
          />
          <p v-if="fieldErrors.confirmPassword" id="login-confirm-error" class="field-error" role="alert">{{ fieldErrors.confirmPassword }}</p>
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

      <div class="demo-box">
        <p class="demo-or"><span>ou</span></p>
        <button type="button" class="btn-demo" :disabled="loading" @click="startDemo">
          <i class="pi pi-play" aria-hidden="true"></i>
          {{ demoLoading ? 'Criando a demo...' : 'Experimentar com conta demo' }}
        </button>
        <p class="demo-hint">Sem cadastro. A conta é temporária e será apagada em 30 minutos.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/http'
import AppLogo from '@/components/common/AppLogo.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// ?modo=cadastro abre direto o cadastro (usado pelos botões "Criar conta real" da conta demo)
const mode = ref<'login' | 'register'>(route.query.modo === 'cadastro' ? 'register' : 'login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const demoLoading = ref(false)
const emailInput = ref<HTMLInputElement | null>(null)
const showPassword = ref(false)
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

// Conta demo: criada na hora, sem e-mail nem senha; o aviso do prazo aparece no topo do app
const startDemo = async () => {
  if (loading.value) return

  loading.value = true
  demoLoading.value = true
  clearFeedback()

  try {
    await authService.demo()
    toast.add({ severity: 'info', summary: 'Conta demo criada', detail: 'Ela será apagada em 30 minutos.', life: 6000 })
    await router.push('/')
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) error.value = 'Muitas tentativas. Aguarde um minuto e tente novamente.'
    else error.value = e instanceof ApiError ? e.message : 'Não foi possível criar a conta demo. Tente novamente.'
  } finally {
    loading.value = false
    demoLoading.value = false
  }
}

// A tela já pode estar aberta quando o link chega (o aviso de tempo esgotado aparece em cima do login): acompanha a URL
watch(
  () => route.query.modo,
  modo => {
    mode.value = modo === 'cadastro' ? 'register' : 'login'
    password.value = ''
    confirmPassword.value = ''
    clearFeedback()
  }
)

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
  padding: 16px;
  background: var(--frame-bg);
}

.login-box {
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  padding: 40px 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.brand {
  display: flex;
  justify-content: center;
  margin: 0 0 8px;
}

.brand :deep(.wordmark) {
  font-size: 30px;
}

.subtitle {
  margin: 0 0 28px;
  font-size: 14px;
  color: var(--text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  text-align: left;
}

.field-label {
  display: block;
  margin: 0 0 6px 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.password-wrapper {
  position: relative;
}

.input-field {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font: inherit;
  font-size: 16px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

.input-field:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 4px var(--accent-glow);
}

.input-field.invalid {
  border-color: var(--danger);
}

.input-field.has-toggle {
  padding-right: 52px;
}

.toggle-password {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-password:hover {
  color: var(--text-primary);
}

.field-error {
  margin: 6px 4px 0;
  font-size: 13px;
  color: var(--danger);
}

.btn-login {
  margin-top: 8px;
  padding: 14px 24px;
  background: var(--accent-strong);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.btn-login:hover:not(:disabled) {
  background: #166534;
  transform: translateY(-1px);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin: 0;
  font-size: 14px;
  color: var(--danger);
}

.switch-mode {
  margin: 24px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.link-button {
  padding: 4px 2px;
  background: none;
  border: none;
  color: var(--accent-text);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.link-button:hover:not(:disabled) {
  text-decoration: underline;
}

.demo-box {
  margin-top: 22px;
}

.demo-or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.demo-or::before,
.demo-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.btn-demo {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 20px;
  background: transparent;
  border: 1px solid var(--accent-color);
  border-radius: 12px;
  color: var(--accent-text);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-demo:hover:not(:disabled) {
  background: var(--accent-soft);
}

.btn-demo:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 480px) {
  .login-box {
    padding: 32px 22px;
  }
}
</style>
