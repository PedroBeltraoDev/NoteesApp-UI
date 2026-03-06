# 📝 NoteesApp - Frontend

> Interface moderna e responsiva para gerenciamento de notas, desenvolvida com Vue.js 3 e TypeScript.

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js&logoColor=white" alt="Vue.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
</p>

---

## 📖 Sobre

O **NoteesApp Frontend** é a interface do usuário do sistema de gerenciamento de notas NoteesApp. Desenvolvido com Vue.js 3 e TypeScript, oferece uma experiência fluida, responsiva e intuitiva para criar, organizar e buscar suas notas com facilidade.

### ✨ Destaques

| Recurso | Descrição |
|---------|-----------|
| 🎨 **Temas** | Alternância entre tema claro e escuro com persistência |
| 📁 **Organização** | Notas agrupadas por pastas e tags personalizáveis |
| 🔍 **Busca** | Pesquisa em tempo real no título e conteúdo das notas |
| 📌 **Fixação** | Destaque para notas importantes no topo da lista |
| 📱 **Responsivo** | Layout adaptável para desktop, tablet e mobile |
| ⌨️ **Acessível** | Navegação por teclado e contraste adequado |
| ⚡ **Performático** | Carregamento rápido com Vite e code splitting |

---

## 🚀 Tecnologias

- **Vue.js 3** (Composition API)
- **Vue Router 4**
- **TypeScript 5.x**
- **Vite 5.x**
- **ESLint + Prettier**
- **CSS3 com Variáveis CSS**
- **Fetch API nativa**

---

## 📋 Pré-requisitos

- **Node.js** 18.x ou superior
- **npm** 9.x ou superior
- **Git** instalado

---

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/PedroBeltraoDev/NotisApp-FE.git
cd NotisApp-FE
```

2.Instale as dependências:
```sh
npm install
```

3.Configure a API em .env:
```sh
VITE_API_BASE_URL=http://localhost:5216/api
```

4.Inicie o servidor de desenvolvimento:
```sh
npm run dev
```

O aplicativo estará disponível em: http://localhost:5173

✨ Funcionalidades
```bash
✅ Criar, editar e excluir notas
✅ Buscar notas por texto
✅ Filtrar por pastas e tags
✅ Fixar notas importantes
✅ Tema claro e escuro
✅ Interface responsiva
✅ Limite de 1000 caracteres por nota
✅ Visualização completa da nota ao clicar
✅ Ordenação por data, recentes e tags
```

🗂️ Estrutura do Projeto
```bash
notis-app/
├── public/              # Arquivos estáticos
├── src/
│   ├── components/      # Componentes Vue
│   │   ├── layout/      # Topbar, Sidebar
│   │   └── notes/       # NoteCard, NoteFormModal
│   ├── router/          # Configuração de rotas
│   ├── views/           # Páginas (Dashboard, Settings)
│   ├── App.vue          # Componente principal
│   └── main.ts          # Ponto de entrada
├── .env                 # Variáveis de ambiente
├── vite.config.ts       # Configuração Vite
└── package.json         # Dependências
```

📦 Comandos Disponíveis
```sh
npm run dev        -> Inicia servidor de desenvolvimento

npm run build      -> Build para produção

npm run preview    -> Preview da build de produção

npm run lint       -> Verifica código com ESLint
```

## 🎯 Roadmap

- Autenticação de usuários
- Sincronização em tempo real (WebSocket)
- Exportar notas como PDF
- Compartilhamento de notas via link
- Upload de imagens nas notas
- Tags com cores personalizadas
- Arquivamento de notas

## 👨‍💻 Autor

Pedro Beltrão

- GitHub: @PedroBeltraoDev
