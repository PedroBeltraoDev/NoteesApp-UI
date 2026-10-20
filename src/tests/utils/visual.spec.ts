import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { noteColorVar } from '@/utils/noteColor'
import { formatNoteDate } from '@/utils/formatDate'
import AppLogo from '@/components/common/AppLogo.vue'

describe('noteColorVar', () => {
  it('notes without a folder use the brand green', () => {
    expect(noteColorVar(null)).toBe('var(--accent-color)')
    expect(noteColorVar(undefined)).toBe('var(--accent-color)')
    expect(noteColorVar('   ')).toBe('var(--accent-color)')
  })

  it('a folder always gets the same palette color', () => {
    expect(noteColorVar('Trabalho')).toBe(noteColorVar('Trabalho'))
    expect(noteColorVar('Trabalho')).toMatch(/^var\(--note-(green|sky|amber|violet|coral|teal)\)$/)
  })

  it('ignores case, accents and surrounding spaces', () => {
    expect(noteColorVar('  Reunião ')).toBe(noteColorVar('reuniao'))
  })

  it('uses more than one color across different folders', () => {
    const colors = new Set(['Trabalho', 'Pessoal', 'Projetos', 'Ideias', 'Viagens', 'Estudos', 'Casa'].map(noteColorVar))

    expect(colors.size).toBeGreaterThan(2)
  })
})

describe('formatNoteDate', () => {
  const now = new Date(2026, 9, 20, 15, 0) // 20/10/2026 15:00 (hora local)

  it('says "Hoje" with the time for notes from today', () => {
    expect(formatNoteDate(new Date(2026, 9, 20, 9, 5).toISOString(), now)).toBe('Hoje, 09:05')
  })

  it('says "Ontem" with the time for notes from yesterday', () => {
    expect(formatNoteDate(new Date(2026, 9, 19, 23, 30).toISOString(), now)).toBe('Ontem, 23:30')
  })

  it('shows day and month for older notes of the same year, without the year', () => {
    const text = formatNoteDate(new Date(2026, 2, 5, 12, 0).toISOString(), now)

    expect(text).toMatch(/5.*mar/i)
    expect(text).not.toContain('2026')
  })

  it('adds the year for notes from other years', () => {
    expect(formatNoteDate(new Date(2025, 11, 31, 12, 0).toISOString(), now)).toContain('2025')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatNoteDate('não é data', now)).toBe('')
  })

  it('handles the month boundary for "Ontem"', () => {
    const firstOfMonth = new Date(2026, 10, 1, 10, 0)

    expect(formatNoteDate(new Date(2026, 9, 31, 18, 0).toISOString(), firstOfMonth)).toBe('Ontem, 18:00')
  })
})

describe('AppLogo', () => {
  it('is an image named NoteesApp when used alone', () => {
    const wrapper = mount(AppLogo)

    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('NoteesApp')
    expect(wrapper.find('.wordmark').exists()).toBe(false)
  })

  it('with the wordmark the icon is decorative and the text carries the name', () => {
    const wrapper = mount(AppLogo, { props: { wordmark: true } })

    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.wordmark').text()).toBe('NoteesApp')
    expect(wrapper.find('.wordmark-accent').text()).toBe('App')
  })

  it('respects the size', () => {
    const wrapper = mount(AppLogo, { props: { size: 52 } })

    expect(wrapper.find('svg').attributes('width')).toBe('52')
    expect(wrapper.find('svg').attributes('height')).toBe('52')
  })

  it('each instance has its own gradient id (several logos on one page)', () => {
    const page = mount({
      components: { AppLogo },
      template: '<div><AppLogo /><AppLogo /></div>'
    })

    const gradients = page.findAll('linearGradient').map(g => g.attributes('id'))
    const fills = page.findAll('svg > rect').filter(r => r.attributes('fill')?.startsWith('url(')).map(r => r.attributes('fill'))

    expect(gradients[0]).toBeTruthy()
    expect(gradients[0]).not.toBe(gradients[1])
    // cada placa aponta para o gradiente da própria instância
    expect(fills).toEqual(gradients.map(id => `url(#${id})`))
  })
})
