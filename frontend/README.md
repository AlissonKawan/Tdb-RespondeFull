# TDB Responde - Front-end

## Descricao

Front-end desenvolvido em React, Vite e TypeScript para o projeto TDB Responde, solucao criada para apoiar o atendimento social, conectando pessoas atendidas, voluntarios e administradores em uma plataforma web integrada com API Java/Quarkus.

## Repositorio GitHub

Repositorio do front-end:
https://github.com/AlissonKawan/Tdb-RespondeFull/tree/Alisson/frontend

## Aplicacao publicada

https://tdb-responde-full.vercel.app/login

## API utilizada

https://tdb-respondefull.onrender.com

## Tecnologias utilizadas

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router DOM
- React Hook Form
- Fetch API nativa
- Vercel

## Estrutura do front-end

- `src/components`: componentes reutilizaveis da interface, separados em `layout`, `ui` e `chat`.
- `src/pages`: paginas principais da aplicacao, como Home, Login, Portais, Atendimentos e Integrantes.
- `src/services`: camada de comunicacao com a API Java/Quarkus usando `fetch` nativo.
- `src/config`: configuracao da URL base da API e da API de IA.
- `src/context`: contexto de autenticacao e estado compartilhado da aplicacao.
- `src/types`: tipos TypeScript usados pelas paginas e services.
- `public/img`: imagens estaticas usadas no front-end.

## Funcionalidades principais

- Navegacao SPA
- Paginas institucionais
- Pagina de integrantes
- Cadastro de beneficiario
- Cadastro de voluntario
- Login de usuarios
- Portal do beneficiario
- Portal do voluntario
- Solicitacao de atendimento
- Listagem e acompanhamento de atendimentos
- Chat vinculado ao atendimento
- Consumo da API Java/Quarkus

## Paginas principais

- `/`
- `/sobre`
- `/faq`
- `/contato`
- `/integrantes`
- `/solucao`
- `/roadmap`
- `/login`
- `/cadastro`
- `/cadastro-beneficiario`
- `/cadastro-voluntario`
- `/quero-ser-voluntario`
- `/portal`
- `/portal/beneficiario`
- `/portal-beneficiario`
- `/portal/voluntario`
- `/portal-voluntario`
- `/beneficiario/solicitar-atendimento`
- `/atendimentos/:id`
- `/admin`
- `/inscricoes-pendentes`
- `/inscricoes-voluntarios`

## Integracao com a API

O front-end consome a API Java/Quarkus publicada no Render usando `fetch` nativo. A URL base fica centralizada em `src/config/api.ts` e pode ser configurada por variavel de ambiente.

| Metodo HTTP | Endpoint | Descricao |
|---|---|---|
| POST | `/auth/login` | Realiza login de usuario. |
| POST | `/auth/register` | Cadastra beneficiario ou voluntario. |
| GET | `/especialidades` | Lista especialidades. |
| GET | `/especialidades/{id}` | Busca especialidade por ID. |
| GET | `/canais` | Lista canais de comunicacao. |
| GET | `/atendimentos` | Lista atendimentos. |
| GET | `/atendimentos/solicitados` | Lista atendimentos solicitados. |
| GET | `/atendimentos/voluntario/{voluntarioId}` | Lista atendimentos por voluntario. |
| GET | `/atendimentos/beneficiario/{beneficiarioId}` | Lista atendimentos por beneficiario. |
| GET | `/atendimentos/beneficiario/conta/{contaId}` | Lista atendimentos por conta de beneficiario. |
| GET | `/atendimentos/{id}` | Busca atendimento por ID. |
| POST | `/atendimentos/solicitar` | Solicita atendimento. |
| POST | `/atendimentos/relatar` | Envia relato de situacao. |
| PUT | `/atendimentos/{id}/assumir` | Permite que voluntario assuma atendimento. |
| PUT | `/atendimentos/{id}/status-prioridade` | Atualiza status e prioridade do atendimento. |
| GET | `/atendimentos/{id}/mensagens` | Lista mensagens do atendimento. |
| POST | `/atendimentos/{id}/mensagens` | Envia mensagem no atendimento. |
| GET | `/usuarios` | Lista usuarios. |
| GET | `/usuarios/{id}` | Busca usuario por ID. |
| PUT | `/usuarios/{id}` | Atualiza usuario. |
| DELETE | `/usuarios/{id}` | Exclui ou desativa usuario. |
| GET | `/voluntarios` | Lista voluntarios. |
| GET | `/voluntarios/{id}` | Busca voluntario por ID. |
| POST | `/voluntarios` | Cadastra voluntario. |
| PUT | `/voluntarios/{id}` | Atualiza voluntario. |
| DELETE | `/voluntarios/{id}` | Exclui voluntario. |
| GET | `/voluntarios/pendentes` | Lista voluntarios pendentes. |
| PUT | `/voluntarios/{id}/aprovar` | Aprova voluntario. |
| POST | `/predict` | Classifica mensagem na API de IA, quando configurada. |

## Variaveis de ambiente

Para rodar usando a API publicada, crie um arquivo `.env` na pasta `frontend/` com:

```env
VITE_API_URL=https://tdb-respondefull.onrender.com
VITE_IA_API_URL=https://URL-DA-IA
```

`VITE_IA_API_URL` so precisa ser configurada se a API de IA estiver publicada.

## Como executar localmente

```bash
cd frontend
npm install
npm run dev
```

A aplicacao abre normalmente em:

```text
http://localhost:5173
```

## Como gerar build

```bash
npm run build
```

O Vite gera a pasta `dist/` com os arquivos prontos para publicacao.

## Deploy na Vercel

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Variavel de ambiente: `VITE_API_URL=https://tdb-respondefull.onrender.com`

O arquivo `vercel.json` mantem as rotas da SPA funcionando ao atualizar a pagina diretamente no navegador.

## Observacoes tecnicas

- O projeto nao usa Axios.
- A comunicacao HTTP usa `fetch` nativo.
- A URL base da API vem de variavel de ambiente.
- A aplicacao depende da API Java para autenticacao, atendimentos, mensagens, voluntarios e usuarios.
- O front esta preparado para consumir a API publicada.

## Integrantes

- Alisson Kawan - GitHub: https://github.com/AlissonKawan - LinkedIn: https://www.linkedin.com/in/AlissonKawan
- Marcos Vinicius - GitHub: https://github.com/marcos-thebest - LinkedIn: https://www.linkedin.com/in/marcos-vinicius-de-jesus-almeida/
- Eduardo Boni - GitHub: https://github.com/bonieduardo75 - LinkedIn: https://www.linkedin.com/in/eduardo-boni-b6b851310

## Links do projeto

- Repositorio do front-end: https://github.com/AlissonKawan/Tdb-RespondeFull/tree/Alisson/frontend
- Front-end publicado: https://tdb-responde-full.vercel.app/login
- Back-end publicado: https://tdb-respondefull.onrender.com
- Video de apresentacao: COLOCAR_LINK_DO_YOUTUBE
