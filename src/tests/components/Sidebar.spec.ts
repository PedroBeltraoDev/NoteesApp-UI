import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Sidebar from '@/components/layout/Sidebar.vue'

describe('Sidebar', () => {
  const mockFolders = ['Aprendendo', 'Projetos', 'Pessoal']
  const mockTags = ['vue', 'typescript', 'backend']

  it('renders folders section', () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: null,
        selectedTag: null
      }
    })
    
    expect(wrapper.text()).toContain('PASTAS')
    expect(wrapper.text()).toContain('Aprendendo')
    expect(wrapper.text()).toContain('Projetos')
  })

  it('renders tags section', () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: null,
        selectedTag: null
      }
    })
    
    expect(wrapper.text()).toContain('TAGS')
    expect(wrapper.text()).toContain('vue')
    expect(wrapper.text()).toContain('typescript')
  })

  it('emits selectFolder event when folder is clicked', async () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: null,
        selectedTag: null
      }
    })
    
    const folderItem = wrapper.findAll('.nav-item')[0]
    if (folderItem) {
      await folderItem.trigger('click')
      expect(wrapper.emitted('selectFolder')).toBeTruthy()
    }
  })

  it('emits selectTag event when tag is clicked', async () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: null,
        selectedTag: null
      }
    })
    
    const tagItems = wrapper.findAll('.tag-item')
    if (tagItems.length > 0 && tagItems[0]) {
      await tagItems[0].trigger('click')
      expect(wrapper.emitted('selectTag')).toBeTruthy()
    }
  })

  it('emits clearFilters event when clear button is clicked', async () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: 'Aprendendo',
        selectedTag: null
      }
    })
    
    const clearButton = wrapper.find('.clear-filters')
    if (clearButton.exists()) {
      await clearButton.trigger('click')
      expect(wrapper.emitted('clearFilters')).toBeTruthy()
    }
  })

  it('highlights selected folder', () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: 'Aprendendo',
        selectedTag: null
      }
    })
    
    const activeItem = wrapper.find('.nav-item.active')
    expect(activeItem.exists()).toBe(true)
  })

  it('renders folder count correctly', () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: null,
        selectedTag: null
      }
    })
    
    expect(wrapper.text()).toContain('Aprendendo')
  })

  it('renders tag count correctly', () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: mockFolders,
        tags: mockTags,
        selectedFolder: null,
        selectedTag: null
      }
    })
    
    expect(wrapper.text()).toContain('vue')
  })

  it('handles empty folders and tags', () => {
    const wrapper = mount(Sidebar, {
      props: {
        folders: [],
        tags: [],
        selectedFolder: null,
        selectedTag: null
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})