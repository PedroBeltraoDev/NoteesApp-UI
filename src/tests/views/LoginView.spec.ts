import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/http'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() }
}))

const stub = { template: '<div />' }

async function mountLogin() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: stub },
      { path: '/', component: stub }
    ]
  })
  await router.push('/login')
  await router.isReady()

  const wrapper = mount(LoginView, { global: { plugins: [router] } })
  return { wrapper, router }
}

const fill = async (wrapper: ReturnType<typeof mount>, values: { email?: string; password?: string; confirm?: string }) => {
  const inputs = wrapper.findAll('input')
  if (values.email !== undefined) await inputs[0]!.setValue(values.email)
  if (values.password !== undefined) await inputs[1]!.setValue(values.password)
  if (values.confirm !== undefined) await inputs[2]!.setValue(values.confirm)
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockReset()
    vi.mocked(authService.register).mockReset()
  })

  it('shows e-mail and password fields in login mode', async () => {
    const { wrapper } = await mountLogin()

    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Entrar')
  })

  it('validates empty fields without calling the API', async () => {
    const { wrapper } = await mountLogin()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Digite seu e-mail')
    expect(wrapper.text()).toContain('Digite sua senha')
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('validates the e-mail format', async () => {
    const { wrapper } = await mountLogin()

    await fill(wrapper, { email: 'nao-e-email', password: 'qualquer' })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('E-mail inválido')
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('logs in and goes to the dashboard', async () => {
    vi.mocked(authService.login).mockResolvedValue({ id: '1', email: 'pessoa@teste.com' })
    const { wrapper, router } = await mountLogin()

    await fill(wrapper, { email: '  pessoa@teste.com ', password: 'senha-segura-123' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(authService.login).toHaveBeenCalledWith('pessoa@teste.com', 'senha-segura-123')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('shows the API message on wrong credentials and clears the password', async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError(401, 'E-mail ou senha inválidos'))
    const { wrapper, router } = await mountLogin()

    await fill(wrapper, { email: 'pessoa@teste.com', password: 'errada' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe('E-mail ou senha inválidos')
    expect((wrapper.findAll('input')[1]!.element as HTMLInputElement).value).toBe('')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('explains rate limiting', async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError(429, 'Muitas tentativas'))
    const { wrapper } = await mountLogin()

    await fill(wrapper, { email: 'pessoa@teste.com', password: 'senha-segura-123' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Aguarde um minuto')
  })

  it('shows a connection message when the server is unreachable', async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError(0, 'Não foi possível conectar ao servidor.'))
    const { wrapper } = await mountLogin()

    await fill(wrapper, { email: 'pessoa@teste.com', password: 'senha-segura-123' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível conectar')
  })

  it('switches to register mode with a confirmation field', async () => {
    const { wrapper } = await mountLogin()

    await wrapper.find('.link-button').trigger('click')

    expect(wrapper.findAll('input')).toHaveLength(3)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Criar conta')
  })

  it('register requires matching passwords of at least 8 characters', async () => {
    const { wrapper } = await mountLogin()
    await wrapper.find('.link-button').trigger('click')

    await fill(wrapper, { email: 'nova@teste.com', password: 'curta', confirm: 'curta' })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('pelo menos 8 caracteres')

    await fill(wrapper, { password: 'senha-segura-123', confirm: 'outra-senha-123' })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('As senhas não conferem')

    expect(authService.register).not.toHaveBeenCalled()
  })

  it('registers and goes to the dashboard', async () => {
    vi.mocked(authService.register).mockResolvedValue({ id: '1', email: 'nova@teste.com' })
    const { wrapper, router } = await mountLogin()
    await wrapper.find('.link-button').trigger('click')

    await fill(wrapper, { email: 'nova@teste.com', password: 'senha-segura-123', confirm: 'senha-segura-123' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(authService.register).toHaveBeenCalledWith('nova@teste.com', 'senha-segura-123')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('shows a duplicated e-mail error from the API', async () => {
    vi.mocked(authService.register).mockRejectedValue(new ApiError(409, 'E-mail já cadastrado'))
    const { wrapper } = await mountLogin()
    await wrapper.find('.link-button').trigger('click')

    await fill(wrapper, { email: 'existe@teste.com', password: 'senha-segura-123', confirm: 'senha-segura-123' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('E-mail já cadastrado')
  })

  it('maps server-side validation errors to the fields', async () => {
    vi.mocked(authService.register).mockRejectedValue(
      new ApiError(400, 'E-mail inválido', { Email: ['E-mail inválido'] })
    )
    const { wrapper } = await mountLogin()
    await wrapper.find('.link-button').trigger('click')

    await fill(wrapper, { email: 'a@b.co', password: 'senha-segura-123', confirm: 'senha-segura-123' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.field-error').text()).toBe('E-mail inválido')
  })
})
