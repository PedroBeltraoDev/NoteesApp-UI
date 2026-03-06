# 📝 NoteesApp - Frontend

Interface moderna e responsiva para o aplicativo de notas NoteesApp, desenvolvida com Vue.js 3 e TypeScript.

## 🚀 Tecnologias

- **Vue.js 3** - Framework progressivo
- **TypeScript** - Tipagem estática
- **Vite** - Build tool ultrarrápida
- **Vue Router** - Roteamento
- **CSS3** - Estilização com variáveis CSS
- **Fetch API** - Requisições HTTP

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git

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
