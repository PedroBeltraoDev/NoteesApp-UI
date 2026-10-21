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
- ✅ **Favoritas**: estrela em cada nota e aba "Favoritas" (as favoritas sempre aparecem primeiro)
- ✅ **Visual em verde**: barra lateral de ícones, cabeçalho com busca e conta, abas, grade de cartões coloridos por pasta
- ✅ **Busca em tempo real** em título, conteúdo, tags e pasta, sem diferenciar maiúsculas nem acentos (também no celular)
- ✅ **Filtros** por pasta e tag
- ✅ **Tema Claro, Escuro ou Sistema** (uma única preferência, salva e aplicada antes de a tela aparecer)
- ✅ **Formulário de nota enxuto**: só o título é obrigatório; a pasta é escolhida em botões (com "Nova pasta" no próprio
  formulário, sem lista flutuante) e as tags são chips com sugestões das que você já usa. Ctrl+Enter salva
- ✅ **Um só diálogo por nota**: clicar no cartão abre direto a edição (com favoritar e excluir). Se você fechar com texto
  digitado, o app pergunta antes de descartar
- ✅ **Criar já no lugar certo**: com um filtro de pasta ou tag ativo, a nota nova nasce nessa pasta/tag; se ela ficar
  escondida por um filtro, pela busca ou pela aba Favoritas, eles saem do caminho para você vê-la
- ✅ **Excluir com "Desfazer"**: a nota some na hora e só é apagada de verdade depois de 6 segundos (sem `confirm()` do navegador)
- ✅ **Menu da conta** (e-mail, Configurações, Sair), disponível em qualquer tamanho de tela
- ✅ **Acessibilidade**: navegação por teclado, foco visível, leitores de tela, contraste AA e link "Pular para o conteúdo"
- ✅ **Design Responsivo** (Mobile, Tablet, Desktop)
- ✅ **Skeleton Loading** para melhor UX
- ✅ **Toast Notifications** para feedback
- ✅ **Conta própria**: cadastro e login com e-mail e senha (JWT com renovação automática)
- ✅ **Notas privadas**: cada usuário vê apenas as próprias notas
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
| **HTTP Client** | Fetch API (cliente próprio com renovação de token) |
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
│   ├── common/
│   │   ├── AppLogo.vue      # logo (placa verde com duas folhas de nota) com ou sem o nome
│   │   └── KebabMenu.vue    # menu ⋮ acessível (setas, Esc, clique fora)
│   ├── layout/
│   │   ├── AppShell.vue     # moldura + barra lateral + cabeçalho + painel (usado por todas as telas logadas)
│   │   ├── NavRail.vue      # barra lateral de ícones (gaveta no celular)
│   │   ├── FilterFlyout.vue # painel de pastas/tags ao lado da barra
│   │   ├── Topbar.vue       # título da página, busca e conta
│   │   └── AccountMenu.vue  # menu da conta acessível
│   └── notes/
│       ├── NoteCard.vue
│       └── NoteFormModal.vue
├── views/
│   ├── DashboardView.vue
│   ├── LoginView.vue
│   └── SettingsView.vue
├── services/
│   ├── http.ts          # cliente HTTP: Bearer, renovação do token e ApiError
│   ├── session.ts       # sessão (tokens + usuário) no localStorage, sincronizada entre abas
│   ├── authService.ts   # cadastro, login, logout, me
│   └── api.ts           # notas, pastas e tags
├── middleware/
│   └── auth.ts          # guard do router
├── router/
│   └── index.ts
├── styles/
│   ├── variables.css
│   ├── global.css
│   └── primevue-overrides.css
├── composables/
│   └── useTheme.ts        # tema único: claro | escuro | sistema
├── utils/
│   └── search.ts          # busca sem acentos, não destrutiva
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

# 5. Rodar em desenvolvimento
npm run dev

# 6. Acessar
http://localhost:5173

# 7. Na tela de login, clique em "Criar conta" e cadastre e-mail e senha (8 a 128 caracteres)
```

> O backend precisa estar rodando com `Jwt__Key` definida e com `http://localhost:5173` em
> `Cors:AllowedOrigins` (é o padrão). Veja o README do backend.

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

## 🔐 Autenticação

- Cadastro e login chamam `/api/auth/register` e `/api/auth/login`. O backend devolve um **access token** (JWT, 15 min)
  e um **refresh token** (14 dias, uso único).
- Toda chamada a `/api/notes/*` leva `Authorization: Bearer <accessToken>` (`src/services/http.ts`).
- Quando o access token vence (401), o cliente chama `/api/auth/refresh` **uma única vez** (mesmo com várias
  requisições falhando juntas e com várias abas abertas, via Web Locks), guarda o novo par de tokens e repete a chamada.
  Isso importa porque o backend trata o reuso de um refresh token como roubo e derruba todas as sessões.
- Se o refresh for recusado, a sessão é encerrada e o app volta para `/login`. Falhas passageiras (rede fora, 429, 5xx)
  **não** deslogam o usuário.
- Logout revoga o refresh token no servidor e limpa a sessão local (também em outras abas).
- Os tokens ficam no `localStorage` (a sessão sobrevive ao fechar a aba). Contrapartida: ficam acessíveis a XSS,
  por isso o access token é curto e o Vue escapa todo conteúdo renderizado.

---

## 🌐 Deploy

### Vercel (Frontend)

O `vercel.json` da **raiz** do repositório já configura o projeto (framework Vite; build padrão `npm run build`, com checagem de tipos, saída em `dist`),
reescreve toda rota para `/index.html` (sem isso, abrir ou recarregar `/login` ou `/configuracoes` dá 404) e adiciona
cabeçalhos de segurança básicos.

1. Importe o repositório na Vercel (Add New > Project). O preset é detectado como Vite.
2. Em **Settings > Environment Variables** defina `VITE_API_BASE_URL` com a URL da API terminada em `/api`
   (ex.: `https://noteesapp-be.onrender.com/api`) para Production e Preview.
3. No **backend (Render)**, libere o endereço do front no CORS: `Cors__AllowedOrigins__0=https://seu-app.vercel.app`
   (uma variável por endereço: `__0`, `__1`...). Previews da Vercel têm endereços próprios; para testá-los, adicione-os também.
4. O backend também precisa de `Jwt__Key` e das migrations aplicadas (veja o README do backend). **Sem a API com login
   no ar, o front novo não consegue entrar.**

Cada push gera um *preview deployment*; o merge na `main` publica em produção.

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

## ♿ Acessibilidade e usabilidade

- **Teclado**: tudo é alcançável com Tab; o título da nota abre a edição; o menu da conta aceita setas, Home/End e Esc.
- **Leitores de tela**: botões só com ícone têm `aria-label`; campos têm `<label>` visível; erros de formulário são
  anunciados (`role="alert"`) e ligados ao campo (`aria-describedby`); o diálogo da nota prende o foco, fecha com Esc
  (perguntando antes de descartar texto digitado) e devolve o foco a quem o abriu. Pastas são botões com `aria-pressed`.
- **Contraste**: textos e botões respeitam 4,5:1 (WCAG AA) nos dois temas. Os tokens ficam em `styles/variables.css`.
- **Toque**: alvos de 44 px no celular; busca, menu da conta e filtros funcionam em telas pequenas.
- **Movimento**: animações são reduzidas para quem ativa "reduzir movimento" no sistema.
- **Estados**: carregamento, conta sem notas, pasta/tag sem notas e busca sem resultado têm mensagens próprias, com ação.

## 🎨 Design System

- **Marca**: logo em `public/logo.svg` e `public/favicon.svg` (também como componente `AppLogo`). Verde `#22c55e`/`#15803d`.
- **Tokens**: todas as cores, raios e medidas do shell estão em `src/styles/variables.css`, nos temas escuro (padrão)
  e claro. Camadas: moldura → barra lateral → fundo → painel → card.
- **Tema**: as classes `dark-mode`/`light-mode` ficam no `<html>` (veja `composables/useTheme.ts`). O PrimeVue calcula
  as variáveis dos componentes em `:root`; com a classe no `<body>`, os painéis soltos fora do app (Select, Toast) saíam brancos no tema escuro.
- **Cores de categoria**: cada pasta tem sempre a mesma cor (borda do cartão e avatar), definida em `utils/noteColor.ts`
  a partir de `--note-green`, `--note-sky`, `--note-amber`, `--note-violet`, `--note-coral` e `--note-teal`. Notas sem pasta usam o verde da marca.
- **Estrutura**: `AppShell` (barra lateral de ícones 72 px, expansível para 232 px com rótulos) + cabeçalho + painel
  com abas "Todas as notas / Favoritas" e botão "Nova nota". No celular a barra vira uma gaveta e a busca abre abaixo do cabeçalho.

## 🔒 Segurança

### Medidas Implementadas

| Medida | Descrição |
|--------|-----------|
| **Autenticação** | JWT de curta duração + refresh token rotativo (validados pelo backend); tokens no localStorage |
| **CORS** | O backend só aceita a origem do frontend (`Cors__AllowedOrigins__0` no Render) |
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
