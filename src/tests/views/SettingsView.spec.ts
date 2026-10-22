import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { apiResponse, makeSession, mockFetch, resetSession } from '../helpers'
import { session } from '@/services/session'

const toastAdd = vi.fn()
const replace = vi.fn()
const push = vi.fn()

vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: toastAdd }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ replace, push }) }))

import SettingsView from '@/views/SettingsView.vue'

const PDialog = defineComponent({
  props: ['visible'],
  emits: ['update:visible'],
  setup: (props, { slots }) => () =>
    props.visible ? h('div', { class: 'dialog-stub' }, [slots.header?.(), slots.default?.(), slots.footer?.()]) : null
})
const AppShell = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })

const mountView = () =>
  mount(SettingsView, { global: { components: { PDialog }, stubs: { AppShell } }, attachTo: document.body })

const openDialog = async (wrapper: ReturnType<typeof mountView>) => {
  await wrapper.find('.btn-delete-account').trigger('click')
}

const confirmButton = (wrapper: ReturnType<typeof mountView>) =>
  wrapper.findAll('button').find(b => b.text() === 'Excluir conta')!

describe('SettingsView: excluir conta', () => {
  beforeEach(() => {
    resetSession()
    session.set(makeSession())
    toastAdd.mockClear()
    replace.mockClear()
    push.mockClear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('has a delete-account card that explains it is permanent, and the dialog starts closed', () => {
    const wrapper = mountView()

    expect(wrapper.find('#delete-title').text()).toBe('Excluir conta')
    expect(wrapper.text()).toContain('Não dá para desfazer')
    expect(wrapper.find('.dialog-stub').exists()).toBe(false)
  })

  it('clicking it opens the confirmation, and cancelling closes it without calling the server', async () => {
    const fetchMock = mockFetch(() => apiResponse(200))
    const wrapper = mountView()

    await openDialog(wrapper)
    expect(wrapper.find('#delete-account-password').exists()).toBe(true)

    await wrapper.findAll('button').find(b => b.text() === 'Cancelar')!.trigger('click')

    expect(wrapper.find('.dialog-stub').exists()).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(session.isAuthenticated).toBe(true)
  })

  it('confirming with the password deletes the account, ends the session, warns and goes to the login', async () => {
    const fetchMock = mockFetch(() => apiResponse(200))
    const wrapper = mountView()
    await openDialog(wrapper)
    await wrapper.find('#delete-account-password').setValue('senha-segura-123')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit]
    expect(String(url)).toContain('/auth/delete-account')
    expect(JSON.parse(init.body as string)).toEqual({ password: 'senha-segura-123' })
    expect(session.isAuthenticated).toBe(false)
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Conta excluída' }))
    expect(replace).toHaveBeenCalledWith('/login')
  })

  it('a wrong password shows the error in the dialog and keeps the account and the session', async () => {
    mockFetch(() => apiResponse(400, { message: 'Senha incorreta', errors: { code: ['invalid_password'] } }))
    const wrapper = mountView()
    await openDialog(wrapper)
    await wrapper.find('#delete-account-password').setValue('errada-123456')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe('Senha incorreta')
    expect(wrapper.find('.dialog-stub').exists()).toBe(true)
    expect(session.isAuthenticated).toBe(true)
    expect(toastAdd).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined() // dá para tentar de novo
  })

  it('without a connection it says so and keeps everything', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch')
    })
    const wrapper = mountView()
    await openDialog(wrapper)
    await wrapper.find('#delete-account-password').setValue('senha-segura-123')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Não foi possível conectar')
    expect(session.isAuthenticated).toBe(true)
  })

  it('a demo account is deleted without a password', async () => {
    session.set(makeSession({ user: { id: 'demo-1', email: 'demo-1@demo.noteesapp.invalid', isDemo: true, demoExpiresAt: new Date(Date.now() + 600_000).toISOString() } }))
    const fetchMock = mockFetch(() => apiResponse(200))
    const wrapper = mountView()
    await openDialog(wrapper)

    expect(wrapper.find('#delete-account-password').exists()).toBe(false)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect((fetchMock.mock.calls[0]![1] as RequestInit).body).toBeUndefined()
    expect(session.isAuthenticated).toBe(false)
    expect(replace).toHaveBeenCalledWith('/login')
  })

  it('the demo dialog does not flip to the password form while the session disappears', async () => {
    session.set(makeSession({ user: { id: 'demo-1', email: 'demo-1@demo.noteesapp.invalid', isDemo: true } }))
    mockFetch(() => apiResponse(200))
    const wrapper = mountView()
    await openDialog(wrapper)

    await wrapper.find('form').trigger('submit')

    // a sessão já foi limpa, mas o diálogo ainda é o da demo
    await flushPromises()
    expect(wrapper.find('#delete-account-password').exists()).toBe(false)
  })
})
