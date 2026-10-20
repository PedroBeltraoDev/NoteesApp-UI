import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteCard from '@/components/notes/NoteCard.vue'

describe('NoteCard', () => {
  const mockNote = {
    id: 1,
    title: 'Nota de Teste',
    content: 'Conteúdo da nota com mais de 150 caracteres para testar a exibição do conteúdo no card da nota. Este texto é longo o suficiente para validar o comportamento do resumo.',
    createdAt: '2024-01-15T10:30:00Z',
    tags: ['vue', 'teste'],
    folder: 'Testes' as string | null,
    isPinned: false
  }

  const mountCard = (note = mockNote) => mount(NoteCard, { props: { note }, attachTo: document.body })

  it('renders the title, the folder and the tags', () => {
    const wrapper = mountCard()

    expect(wrapper.find('.note-title').text()).toBe('Nota de Teste')
    expect(wrapper.find('.note-folder-name').text()).toBe('Testes')
    expect(wrapper.findAll('.note-tags .tag').map(t => t.text())).toEqual(['vue', 'teste'])
    wrapper.unmount()
  })

  it('shows "Sem pasta" for notes without a folder', () => {
    const wrapper = mountCard({ ...mockNote, folder: null })

    expect(wrapper.find('.note-folder-name').text()).toBe('Sem pasta')
    wrapper.unmount()
  })

  it('shows the whole content (the clamp is done by CSS, no cut in the middle of a word)', () => {
    const wrapper = mountCard()

    expect(wrapper.find('.note-content').text()).toBe(mockNote.content)
    expect(wrapper.find('.read-more').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows a readable date with a machine-readable datetime', () => {
    const wrapper = mountCard()

    const time = wrapper.find('time')
    expect(time.attributes('datetime')).toBe(mockNote.createdAt)
    expect(time.text()).toMatch(/jan|2024/i)
    wrapper.unmount()
  })

  it('colors the card by folder, always the same color for the same folder', () => {
    const a = mountCard()
    const b = mountCard({ ...mockNote, id: 2, folder: 'testes' })

    const colorA = a.find('.note-card').attributes('style')
    expect(colorA).toContain('--note-color')
    expect(b.find('.note-card').attributes('style')).toBe(colorA)
    a.unmount()
    b.unmount()
  })

  it('emits delete with the note id from the trash button', async () => {
    const wrapper = mountCard()

    await wrapper.find('.icon-action.delete').trigger('click')

    expect(wrapper.emitted('delete')?.[0]).toEqual([mockNote.id])
    wrapper.unmount()
  })

  it('emits togglePin with the note id from the star button', async () => {
    const wrapper = mountCard()

    await wrapper.find('.icon-action.star').trigger('click')

    expect(wrapper.emitted('togglePin')?.[0]).toEqual([mockNote.id])
    wrapper.unmount()
  })

  it('the star reflects whether the note is a favorite', () => {
    const plain = mountCard()
    const favorite = mountCard({ ...mockNote, isPinned: true })

    expect(plain.find('.icon-action.star').attributes('aria-pressed')).toBe('false')
    expect(plain.find('.icon-action.star i').classes()).toContain('pi-star')
    expect(favorite.find('.icon-action.star').attributes('aria-pressed')).toBe('true')
    expect(favorite.find('.icon-action.star i').classes()).toContain('pi-star-fill')
    expect(favorite.find('.note-card').classes()).toContain('favorite')
    plain.unmount()
    favorite.unmount()
  })

  it('the ⋮ menu offers Abrir, Editar and Excluir', async () => {
    const wrapper = mountCard()

    await wrapper.find('.kebab-trigger').trigger('click')

    expect(wrapper.findAll('[role="menuitem"]').map(i => i.text())).toEqual(['Abrir', 'Editar', 'Excluir'])
    wrapper.unmount()
  })

  it('emits edit with the note from the ⋮ menu', async () => {
    const wrapper = mountCard()
    await wrapper.find('.kebab-trigger').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')

    expect(wrapper.emitted('edit')?.[0]).toEqual([mockNote])
    wrapper.unmount()
  })

  it('emits delete from the ⋮ menu', async () => {
    const wrapper = mountCard()
    await wrapper.find('.kebab-trigger').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[2]!.trigger('click')

    expect(wrapper.emitted('delete')?.[0]).toEqual([mockNote.id])
    wrapper.unmount()
  })

  it('"Abrir" in the ⋮ menu opens the full note', async () => {
    const wrapper = mountCard()
    await wrapper.find('.kebab-trigger').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[0]!.trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('clicking the action buttons does not open the full note', async () => {
    const wrapper = mountCard()

    await wrapper.find('.icon-action.star').trigger('click')
    await wrapper.find('.icon-action.delete').trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('"Editar nota" inside the full view closes it and emits edit', async () => {
    const wrapper = mountCard()
    await wrapper.find('.note-card').trigger('click')

    await wrapper.find('.btn-edit').trigger('click')

    expect(wrapper.emitted('edit')?.[0]).toEqual([mockNote])
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
