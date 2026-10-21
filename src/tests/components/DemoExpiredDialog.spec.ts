import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import DemoExpiredDialog from '@/components/common/DemoExpiredDialog.vue'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/http'
import { demoState } from '@/services/demo'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), demo: vi.fn(), logout: vi.fn(), me: vi.fn() }
}))

// O Dialog do PrimeVue precisa do plugin; aqui basta o contrato de props e slots
const PDialog = defineComponent({
  props: ['visible', 'closable', 'closeOnEscape', 'dismissableMask'],
  setup: (props, { slots }) => () =>
    h('div', { class: 'dialog-stub', 'data-visible': String(props.visible), 'data-closable': String(props.closable), 'data-esc': String(props.closeOnEscape), 'data-mask': String(props.dismissableMask) },
      [slots.header?.(), slots.default?.(), slots.footer?.()])
})

const stub = { template: '<div />' }

async function mountDialog() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/login', component: stub }
    ]
  })
  await router.push('/login')
  await router.isReady()
  const wrapper = mount(DemoExpiredDialog, { global: { plugins: [router], components: { PDialog } } })
  return { wrapper, router }
}

const button = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find(b => b.text().includes(text))!

describe('DemoExpiredDialog', () => {
  beforeEach(() => {
    demoState.expired = true
    vi.mocked(authService.demo).mockReset()
  })

  it('is shown only when the demo time ran out', async () => {
    demoState.expired = false
    const { wrapper } = await mountDialog()
    expect(wrapper.find('.dialog-stub').attributes('data-visible')).toBe('false')

    demoState.expired = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.dialog-stub').attributes('data-visible')).toBe('true')
  })

  it('says the time is up and that the notes from the demo are gone', async () => {
    const { wrapper } = await mountDialog()

    expect(wrapper.find('#demo-expired-title').text()).toContain('O tempo da demo acabou')
    expect(wrapper.text()).toContain('já foi encerrada')
    expect(wrapper.text()).toContain('notas que você criou')
  })

  it('cannot be dismissed without choosing: no ✕, no Esc, no click outside', async () => {
    const { wrapper } = await mountDialog()
    const dialog = wrapper.find('.dialog-stub')

    expect(dialog.attributes('data-closable')).toBe('false')
    expect(dialog.attributes('data-esc')).toBe('false')
    expect(dialog.attributes('data-mask')).toBe('false')
  })

  it('offers exactly the two options: a new demo account or a real account', async () => {
    const { wrapper } = await mountDialog()

    expect(wrapper.findAll('button').map(b => b.text())).toEqual(['Criar conta real', 'Criar nova conta demo'])
    expect(button(wrapper, 'Criar nova conta demo').attributes('autofocus')).toBeDefined()
  })

  it('"Criar nova conta demo" creates it, closes the notice and goes to the notes', async () => {
    vi.mocked(authService.demo).mockResolvedValue({ id: 'u', email: 'd@x', isDemo: true } as any)
    const { wrapper, router } = await mountDialog()

    await button(wrapper, 'Criar nova conta demo').trigger('click')
    await flushPromises()

    expect(authService.demo).toHaveBeenCalledOnce()
    expect(demoState.expired).toBe(false)
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('shows progress while creating and does not allow a double click', async () => {
    let finish!: (user: any) => void
    vi.mocked(authService.demo).mockReturnValue(new Promise(resolve => (finish = resolve)))
    const { wrapper } = await mountDialog()

    await button(wrapper, 'Criar nova conta demo').trigger('click')

    expect(button(wrapper, 'Criando...').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Criar conta real').attributes('disabled')).toBeDefined()

    finish({ id: 'u', email: 'd@x' })
    await flushPromises()
  })

  it('if the new demo fails, the notice stays and explains why', async () => {
    vi.mocked(authService.demo).mockRejectedValue(new ApiError(503, 'Há muitas contas demo ativas agora. Tente novamente em alguns minutos'))
    const { wrapper, router } = await mountDialog()

    await button(wrapper, 'Criar nova conta demo').trigger('click')
    await flushPromises()

    expect(demoState.expired).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toContain('muitas contas demo ativas')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(button(wrapper, 'Criar nova conta demo').attributes('disabled')).toBeUndefined() // dá para tentar de novo
  })

  it('a network failure gets a generic message', async () => {
    vi.mocked(authService.demo).mockRejectedValue(new Error('rede'))
    const { wrapper } = await mountDialog()

    await button(wrapper, 'Criar nova conta demo').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Não foi possível criar a conta demo')
  })

  it('"Criar conta real" closes the notice and opens the sign-up form', async () => {
    const { wrapper, router } = await mountDialog()

    await button(wrapper, 'Criar conta real').trigger('click')
    await flushPromises()

    expect(demoState.expired).toBe(false)
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query).toEqual({ modo: 'cadastro' })
    expect(authService.demo).not.toHaveBeenCalled()
  })
})
