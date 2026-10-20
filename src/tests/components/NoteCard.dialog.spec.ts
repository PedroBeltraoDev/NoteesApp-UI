import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteCard from '@/components/notes/NoteCard.vue'

const note = {
  id: 7,
  title: 'Reunião de planejamento',
  content: 'Revisar metas do trimestre e alinhar prioridades com o time.',
  createdAt: '2026-10-20T12:00:00Z',
  tags: ['importante'],
  folder: 'Trabalho',
  isPinned: false
}

const mountCard = () => mount(NoteCard, { props: { note }, attachTo: document.body })

describe('NoteCard (acessibilidade)', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.body.innerHTML = ''
  })

  it('the title is a button that opens the note (keyboard friendly)', async () => {
    const wrapper = mountCard()

    await wrapper.find('button.note-open').trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the action buttons say which note they act on', () => {
    const wrapper = mountCard()

    const labels = wrapper.findAll('.action-btn').map(b => b.attributes('aria-label'))

    expect(labels).toEqual([
      'Editar nota Reunião de planejamento',
      'Fixar nota Reunião de planejamento',
      'Excluir nota Reunião de planejamento'
    ])
    wrapper.unmount()
  })

  it('the pin action name follows the state', () => {
    const wrapper = mount(NoteCard, { props: { note: { ...note, isPinned: true } }, attachTo: document.body })

    expect(wrapper.findAll('.action-btn')[1]!.attributes('aria-label')).toBe('Desfixar nota Reunião de planejamento')
    wrapper.unmount()
  })

  it('opens an accessible modal dialog named after the note', async () => {
    const wrapper = mountCard()

    await wrapper.find('.note-card').trigger('click')

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    const titleId = dialog.attributes('aria-labelledby')!
    expect(wrapper.find(`#${titleId}`).text()).toBe('Reunião de planejamento')
    wrapper.unmount()
  })

  it('moves the focus into the dialog and locks the page scroll', async () => {
    const wrapper = mountCard()

    await wrapper.find('.note-card').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.find('.close-btn').element)
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
  })

  it('the close button has a name and closes the dialog', async () => {
    const wrapper = mountCard()
    await wrapper.find('.note-card').trigger('click')

    const close = wrapper.find('.close-btn')
    expect(close.attributes('aria-label')).toBe('Fechar')
    await close.trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Escape closes the dialog and unlocks the scroll', async () => {
    const wrapper = mountCard()
    await wrapper.find('.note-card').trigger('click')

    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('clicking the backdrop closes, clicking inside does not', async () => {
    const wrapper = mountCard()
    await wrapper.find('.note-card').trigger('click')

    await wrapper.find('.modal-body').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Tab on the last control wraps to the first (focus trap)', async () => {
    const wrapper = mountCard()
    await wrapper.find('.note-card').trigger('click')
    await wrapper.vm.$nextTick()

    // Só há um controle focável (Fechar): Tab e Shift+Tab ficam nele
    const close = wrapper.find('.close-btn').element as HTMLElement
    close.focus()
    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(close)

    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(close)
    wrapper.unmount()
  })

  it('returns the focus to the title button after closing', async () => {
    const wrapper = mountCard()
    const opener = wrapper.find('button.note-open').element as HTMLElement
    opener.focus()

    await wrapper.find('button.note-open').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.find('.close-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(opener)
    wrapper.unmount()
  })
})
