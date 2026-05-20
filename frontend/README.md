# TDB Responde

Front-end React + Vite + TypeScript para a Sprint 4 da FIAP, com estilização em TailwindCSS e integração por `fetch` nativo com API Java/Quarkus.

## Tecnologias

- React 18
- Vite
- TypeScript
- TailwindCSS
- React Router
- React Hook Form
- Fetch API nativa
- Back-end esperado: Java + Quarkus

## Como rodar o front-end

```bash
npm install
npm run dev
```

Por padrao, o Vite abre em `http://localhost:5173`.

## Configuracao da API

Crie um arquivo `.env` na raiz do projeto quando precisar apontar para outra API:

```env
VITE_API_URL=http://localhost:8080
VITE_IA_API_URL=http://localhost:5000
```

Se as variaveis nao existirem, o front usa `http://localhost:8080` para a API Java e `http://localhost:5000` para a API de IA. A tela continua funcionando mesmo se a API de IA nao estiver disponivel.

## Deploy na Vercel

Configure o projeto na Vercel com:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Variaveis de ambiente:

```env
VITE_API_URL=https://tdb-respondefull.onrender.com
VITE_IA_API_URL=https://URL-DA-IA
```

`VITE_IA_API_URL` so precisa ser configurada se a API de IA estiver publicada.

O back-end Java/Quarkus precisa estar publicado antes do deploy do front consumir dados reais. Nesta entrega, o back-end esta em `https://tdb-respondefull.onrender.com/`. Libere CORS no Quarkus para a URL final da Vercel, `https://tdb-responde-full.vercel.app`, alem do ambiente local usado em desenvolvimento.

O arquivo `vercel.json` inclui rewrite para SPA, permitindo atualizar diretamente rotas do React Router como `/login`, `/integrantes`, `/solucao`, `/roadmap` e `/atendimentos/:id`.

## Como rodar o back-end

Este checkout nao contem o projeto Java/Quarkus (`pom.xml`, `src/main/java` ou Resources REST). No repositorio do back-end, use o comando equivalente:

```bash
mvn quarkus:dev
```

O Quarkus deve liberar CORS para o front local, por exemplo `http://localhost:5173`, e para a URL de producao.

## Endpoints consumidos

Autenticacao e portal:

- `POST /auth/register`
- `POST /auth/login`
- `GET /especialidades`
- `GET /atendimentos`
- `GET /atendimentos/solicitados`
- `GET /atendimentos/voluntario/{voluntarioId}`
- `GET /atendimentos/beneficiario/{beneficiarioId}`
- `GET /atendimentos/beneficiario/conta/{contaId}`
- `POST /atendimentos/solicitar`
- `PUT /atendimentos/{atendimentoId}/assumir`
- `PUT /atendimentos/{atendimentoId}/status-prioridade`
- `GET /atendimentos/{id}`
- `GET /atendimentos/{atendimentoId}/mensagens`
- `POST /atendimentos/{atendimentoId}/mensagens`
- `GET /voluntarios/pendentes`
- `PUT /voluntarios/{id}/aprovar`
- `GET /usuarios`
- `GET /usuarios/{id}`
- `PUT /usuarios/{id}`
- `DELETE /usuarios/{id}`

Services administrativos ainda existentes:

- `GET /voluntarios`
- `GET /voluntarios/{id}`
- `POST /voluntarios`
- `PUT /voluntarios/{id}`
- `DELETE /voluntarios/{id}`
- `GET /especialidades`
- `GET /especialidades/{id}`

## Principais telas

- Home institucional
- Sobre
- FAQ
- Contato
- Integrantes
- Solucao
- Alias `/solucao` para a pagina de solucao do projeto
- Login
- Portal do Beneficiario
- Cadastro de Beneficiario
- Solicitacao de Atendimento
- Detalhe do Atendimento com chat
- Portal do Voluntario
- Painel do Voluntario
- Cadastro publico de voluntario

## Integrantes

- Alisson Kawan
- Marcos Vinicius
- Eduardo Boni

## Observacoes de integracao

- O projeto nao usa Axios.
- A camada HTTP fica em `src/services/apiClient.ts`.
- A URL base fica em `src/config/api.ts`.
- Cadastro de voluntario chama `POST /auth/register` com `tipoUsuario: "VOLUNTARIO"`, `especialidadeId` e `motivoVoluntariado`.
- Voluntarios nascem pendentes/inativos conforme regra do back-end e precisam de aprovacao antes do login.
- Cadastro de beneficiario chama `POST /auth/register` com `tipoUsuario: "BENEFICIARIO"` e envia `tipoPessoaAtendida`/`tipoBeneficiario`.
- Login chama `POST /auth/login` e salva apenas o usuario retornado como sessao simples.
- No front, "beneficiario" e o nome amigavel para PESSOA_ATENDIDA. O ID usado nas chamadas e `pessoaAtendidaId` ou `beneficiarioId`.
- Portal do voluntario chama `GET /atendimentos/solicitados` e `GET /atendimentos/voluntario/{voluntarioId}`.
- Portal do beneficiario chama `GET /atendimentos/beneficiario/{beneficiarioId}`.
- Solicitacao de atendimento chama `POST /atendimentos/solicitar` com `beneficiarioId`, `prioridade`, `canalComunicacaoId` e `descricao`.
- Detalhe do atendimento chama `GET /atendimentos/{id}`.
- Chat do atendimento chama `GET /atendimentos/{atendimentoId}/mensagens` e `POST /atendimentos/{atendimentoId}/mensagens`.
- A tela `/voluntarios/pendentes` chama `GET /voluntarios/pendentes` e `PUT /voluntarios/{id}/aprovar`.
- `PUT /voluntarios/{id}/aprovar` pode retornar `204 No Content`; o `apiClient` trata resposta vazia sem tentar ler JSON.
- O botao "Assumir atendimento" chama o endpoint existente no back-end:

```http
PUT /atendimentos/{atendimentoId}/assumir
Content-Type: application/json

{
  "voluntarioId": 1
}
```

## Links

- GitHub: https://github.com/AlissonKawan/Tdb-RespondeFull.git
- Frontend Vercel: https://tdb-responde-full.vercel.app/login
- Backend Render: https://tdb-respondefull.onrender.com/
- YouTube: preencher com a URL do video
