# 📝 NoteesApp - Frontend

Aplicação web moderna para gerenciamento de notas com organização por pastas e tags, desenvolvida com Vue 3, PrimeVue e TypeScript.

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com/)

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Responsividade](#-responsividade)

---

## ✨ Funcionalidades

- ✅ **CRUD Completo** de notas
- ✅ **Organização por Pastas** e Tags
- ✅ **Notas Fixadas** (pin/unpin)
- ✅ **Busca em Tempo Real** com debounce
- ✅ **Filtros** por pasta e tag
- ✅ **Tema Escuro/Claro** (persistente)
- ✅ **Design Responsivo** (Mobile, Tablet, Desktop)
- ✅ **Modal de Visualização** completa da nota
- ✅ **Skeleton Loading** para melhor UX
- ✅ **Toast Notifications** para feedback
- ✅ **Autenticação Simples** (senha)
- ✅ **Ícones PrimeIcons** (sem emojis)
- ✅ **Testes Unitários** com Vitest

---

## 🛠 Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | Vue 3.5 (Composition API) |
| **Linguagem** | TypeScript 5.8 |
| **UI Library** | PrimeVue 4 + PrimeIcons |
| **Theme** | @primeuix/themes (Aura) |
| **HTTP Client** | Axios |
| **Router** | Vue Router 4 |
| **Build Tool** | Vite 6 |
| **Testes** | Vitest, Vue Test Utils, jsdom |
| **Deploy** | Vercel (Edge Network) |
| **CSS** | CSS Variables + Scoped CSS |

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    NoteesApp Frontend                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │   Views     │ → │ Components  │ → │    Services     │    │
│  │  (Pages)    │   │   (UI)      │   │   (API Calls)   │    │
│  └─────────────┘   └─────────────┘   └────────┬────────┘    │
│                                               │             │
│                                        ┌──────▼──────┐      │
│                                        │   Backend   │      │
│                                        │   (Render)  │      │
│                                        └─────────────┘      │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │   Router    │   │   Styles    │   │      Utils      │    │
│  │   (Vue)     │   │  (CSS Vars) │   │  (Debounce,etc) │    │
│  └─────────────┘   └─────────────┘   └─────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Pastas

```
src/
├── components/
│   ├── layout/
│   │   ├── Topbar.vue
│   │   └── Sidebar.vue
│   └── notes/
│       ├── NoteCard.vue
│       ├── NoteFormModal.vue
│       └── NoteCardSkeleton.vue
├── views/
│   ├── DashboardView.vue
│   ├── LoginView.vue
│   └── SettingsView.vue
├── services/
│   └── api.ts
├── router/
│   └── index.ts
├── styles/
│   ├── variables.css
│   ├── global.css
│   └── primevue-overrides.css
├── utils/
│   └── debounce.ts
├── tests/
│   └── components/
│       ├── NoteCard.spec.ts
│       ├── Sidebar.spec.ts
│       └── Topbar.spec.ts
└── App.vue
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- npm ou yarn
- Git

### Passos

```bash
# 1. Clonar repositório
git clone https://github.com/PedroBeltraoDev/NoteesApp-UI.git
cd notis-app

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env.local

# 4. Configurar variáveis no .env.local
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_PASSWORD=1234

# 5. Rodar em desenvolvimento
npm run dev

# 6. Acessar
http://localhost:5173

# 7. Senha de acesso: 1234
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Testes (watch mode)
npm run test

# Testes (uma vez)
npm run test:run

# Testes com coverage
npm run test:coverage

# Type check
npm run type-check
```

---

## 🧪 Testes

### Rodar Testes

```bash
# Todos os testes (watch mode)
npm run test

# Rodar uma vez e sair
npm run test:run

# Com relatório de coverage
npm run test:coverage

# Interface visual
npm run test:ui
```
### Exemplo de Teste

```typescript
// src/tests/components/NoteCard.spec.ts
import { mount } from '@vue/test-utils'
import NoteCard from '@/components/notes/NoteCard.vue'

describe('NoteCard', () => {
  it('renders note title correctly', () => {
    const wrapper = mount(NoteCard, {
      props: { 
        note: { 
          id: 1, 
          title: 'Nota de Teste',
          content: 'Conteúdo...',
          createdAt: '2024-01-15',
          isPinned: false 
        } 
      }
    })
    
    expect(wrapper.text()).toContain('Nota de Teste')
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote }
    })
    
    await wrapper.find('.action-btn.delete').trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})
```

---

## 🌐 Deploy

### Vercel (Frontend)

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["iad1"],
  "env": {
    "VITE_API_BASE_URL": "https:apiDoBack"
  }
}
```
---

## 📱 Responsividade

### Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Mobile | < 768px | 1 coluna, sidebar drawer |
| Tablet | 768px - 1024px | 2 colunas, sidebar reduzida |
| Desktop | > 1024px | 3 colunas, sidebar completa |
| Large | > 1400px | 4 colunas |

### Features Mobile

- ✅ Menu hamburger com drawer
- ✅ Touch-friendly buttons (min 44px)
- ✅ Search input oculto (economiza espaço)
- ✅ Grid de notas com 1 coluna
- ✅ Modal full-screen

---

## 🎨 Design System

### Cores (CSS Variables)

```css
:root {
  /* Light Mode */
  --bg-primary: #f8f7f4;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f0f0f0;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border-color: #e0e0e0;
  --accent-color: #3b82f6;
  --hover-bg: #f5f5f5;
}

.dark-mode {
  /* Dark Mode */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3d3d3d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-tertiary: #888888;
  --border-color: #444444;
  --accent-color: #60a5fa;
  --hover-bg: #3d3d3d;
}
```

## 🔒 Segurança

### Medidas Implementadas

| Medida | Descrição |
|--------|-----------|
| **Autenticação** | Senha simples (localStorage) |
| **CORS** | Apenas backend autorizado |
| **XSS Protection** | Vue auto-escapes conteúdo |
| **HTTPS** | Forçado na Vercel |
| **Environment Variables** | Credenciais no .env.local |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 👨‍💻 Autor

**Pedro Beltrão**

- GitHub: [@PedroBeltraoDev](https://github.com/PedroBeltraoDev)
- LinkedIn: [pedro-beltrao](https://www.linkedin.com/in/pedro-beltr%C3%A3o123/)
- Email: pedrobeltrao.dev@gmail.com

---

<div align="center">

**Feito por Pedro Beltrão**

[⬆ Voltar ao topo](#-noteesapp---frontend)

</div>
