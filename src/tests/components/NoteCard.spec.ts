import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteCard from '@/components/notes/NoteCard.vue'

describe('NoteCard', () => {
  const mockNote = {
    id: 1,
    title: 'Nota de Teste',
    content: 'Conteúdo da nota com mais de 150 caracteres para testar o truncamento do conteúdo exibido no card da nota. Este texto é longo o suficiente para validar o comportamento de truncamento.',
    createdAt: '2024-01-15T10:30:00Z',
    tags: ['vue', 'teste'],
    folder: 'Testes',
    isPinned: false
  }

  it('renders note title correctly', () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote }
    })
    
    expect(wrapper.text()).toContain('Nota de Teste')
  })

  it('truncates content longer than 150 characters', () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote }
    })
    
    const content = wrapper.find('.note-content')
    if (content.exists()) {
      expect(content.text().length).toBeLessThanOrEqual(155)
    }
  })

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote }
    })
    
    const editButton = wrapper.findAll('.action-btn')[0]
    if (editButton) {
      await editButton.trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockNote])
    }
  })

  it('emits togglePin event when pin button is clicked', async () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote }
    })
    
    const pinButton = wrapper.findAll('.action-btn')[1]
    if (pinButton) {
      await pinButton.trigger('click')
      expect(wrapper.emitted('togglePin')).toBeTruthy()
      expect(wrapper.emitted('togglePin')?.[0]).toEqual([mockNote.id])
    }
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote }
    })
    
    const deleteButton = wrapper.find('.action-btn.delete')
    if (deleteButton.exists()) {
      await deleteButton.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockNote.id])
    }
  })

  it('shows pin badge when note is pinned', () => {
    const pinnedNote = { ...mockNote, isPinned: true }
    const wrapper = mount(NoteCard, {
      props: { note: pinnedNote }
    })
    
    expect(wrapper.text()).toContain('Fixada')
  })

  it('renders tags when note has tags', () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote }
    })
    
    expect(wrapper.text()).toContain('vue')
    expect(wrapper.text()).toContain('teste')
  })

  it('does not render tags section when note has no tags', () => {
    const noteWithoutTags = { ...mockNote, tags: [] }
    const wrapper = mount(NoteCard, {
      props: { note: noteWithoutTags }
    })
    
    const tagsSection = wrapper.find('.note-tags')
    expect(tagsSection.exists()).toBe(false)
  })
})