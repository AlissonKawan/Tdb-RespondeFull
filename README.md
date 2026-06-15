# TDB Responde - Full Stack Application

Bem-vindo ao repositório completo do **TDB Responde**. Esta plataforma foi criada para organizar, centralizar e facilitar o atendimento social, conectando beneficiários, voluntários e administradores através de uma interface web dinâmica e uma API robusta.

## 📋 Índice
- [Visão Geral e Arquitetura](#-visão-geral-e-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Ambiente de Desenvolvimento (Manutenção)](#-ambiente-de-desenvolvimento-manutenção)
  - [Pré-requisitos](#pré-requisitos)
  - [Executando o Back-end](#executando-o-back-end)
  - [Executando o Front-end](#executando-o-front-end)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Banco de Dados (Oracle SQL)](#-banco-de-dados-oracle-sql)
- [Deploy e Publicação](#-deploy-e-publicação)
- [Equipe](#-equipe)

---

## 🌐 Visão Geral e Arquitetura

O sistema funciona com uma arquitetura separada (Client-Server), onde o front-end consome os endpoints REST expostos pelo back-end.

1. **Front-end (SPA)**: Aplicação web construída em **React** e **Vite**, que fornece portais exclusivos para Beneficiários, Voluntários e Administradores. O gerenciamento de estado e chamadas à API são realizados com as ferramentas nativas (`fetch`) e TypeScript.
2. **Back-end (API REST)**: Construído com **Java 21** e **Quarkus**, garante alta performance. A conexão com o banco de dados **Oracle** é feita de forma manual via JDBC, mantendo controle direto sobre as consultas.
3. **Inteligência Artificial (Opcional)**: Há integração com um modelo de IA para categorização e predição (acessível caso a rota `VITE_IA_API_URL` esteja configurada).

---

## 📂 Estrutura do Projeto

O repositório é monorepo e está dividido nos seguintes diretórios principais:

```text
Tdb-RespondeFull/
├── frontend/        # Código-fonte da interface (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/ # Componentes reutilizáveis de UI, Layout e Chat
│   │   ├── pages/      # Páginas da SPA (Login, Cadastros, Portais)
│   │   ├── services/   # Funções de requisição HTTP (API Fetch)
│   │   ├── context/    # Contextos globais (Autenticação)
│   │   └── config/     # Arquivos de configuração da aplicação
│   └── package.json    # Dependências do Front-end
│
├── backend/         # Código-fonte da API (Java + Quarkus)
│   ├── src/main/java/br/com/tdbresponde/
│   │   ├── bo/         # Camada de Regras de Negócio (Business Object)
│   │   ├── dao/        # Camada de Acesso aos Dados (Data Access Object)
│   │   ├── dto/        # Objetos de Transferência de Dados
│   │   ├── model/      # Entidades do Domínio
│   │   ├── resource/   # Controladores REST (Endpoints)
│   │   └── config/     # Configurações de injeção e segurança
│   └── pom.xml         # Dependências Maven
│
├── database/        # Scripts SQL para criação de tabelas e inserção (Oracle)
├── IA-API/          # Projeto da API Python/IA para predições
└── docs/            # Documentações complementares e artefatos de entrega
```

---

## 🛠 Tecnologias Utilizadas

### Back-end
- **Linguagem**: Java 21 LTS
- **Framework**: Quarkus 3.x
- **Gerenciador**: Maven
- **Persistência**: JDBC (Driver Oracle)
- **Banco de Dados**: Oracle Database

### Front-end
- **Linguagem**: TypeScript
- **Bibliotecas/Frameworks**: React, Vite, React Router DOM, React Hook Form
- **Estilização**: Tailwind CSS
- **Requisições HTTP**: Fetch API

---

## ⚙️ Ambiente de Desenvolvimento (Manutenção)

### Pré-requisitos
- Java 21 LTS instalado e configurado no PATH.
- Node.js v18+ e NPM (para o front-end).
- Maven configurado (ou usar a extensão do IntelliJ).
- Banco de Dados Oracle acessível.

### Executando o Back-end
O Quarkus oferece o modo "Dev", com _Hot Reload_ automático, ótimo para manutenção contínua.

1. Acesse o diretório do back-end:
   ```bash
   cd backend
   ```
2. Configure as variáveis de ambiente necessárias (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
3. Execute o modo Dev:
   ```bash
   mvn quarkus:dev
   ```
4. A API rodará em `http://localhost:8080`.
   - **Ping Test**: Faça um `GET` em `http://localhost:8080/ping` para verificar se está no ar.

### Executando o Front-end
O Vite proporciona um ambiente de desenvolvimento muito ágil para o front-end.

1. Acesse o diretório do front-end:
   ```bash
   cd frontend
   ```
2. Instale as dependências na primeira execução:
   ```bash
   npm install
   ```
3. Crie o arquivo `.env` baseando-se no `.env.example` e aponte `VITE_API_URL` para o seu back-end local (`http://localhost:8080`).
4. Inicialize a aplicação:
   ```bash
   npm run dev
   ```
5. O portal estará acessível em `http://localhost:5173`.

---

## 🔑 Variáveis de Ambiente

Ao realizar a manutenção ou publicar o sistema, você deve garantir as seguintes variáveis:

**Back-end (`backend/src/main/resources/application.properties` ou Export/Env):**
- `DB_URL`: JDBC URL de conexão Oracle.
- `DB_USERNAME`: Usuário do Oracle.
- `DB_PASSWORD`: Senha do Oracle.
- `PORT`: Porta da API (Padrão 8080).

**Front-end (`frontend/.env`):**
- `VITE_API_URL`: URL principal do Back-end. (Ex: `https://tdb-respondefull.onrender.com`)
- `VITE_IA_API_URL`: Rota para o modelo de IA (quando aplicável).

---

## 🗄 Banco de Dados (Oracle SQL)

A API gerencia os dados de forma relacional. Caso haja necessidade de recriar o banco ou atualizar esquemas, vá para a pasta `database/` ou verifique as migrações criadas no back-end:

- `T_CONTA_USUARIO`: Gerencia logins centralizados (Senha convertida em HASH com salt, não em texto puro).
- `VOLUNTARIO`, `PESSOA_ATENDIDA`: Estendem o conceito de conta para perfis específicos.
- `ATENDIMENTO`: Representa o vínculo e histórico de solicitações.
- Scripts manuais recomendados de execução: 
  1. `01_drop_tables.sql`
  2. `02_create_tables.sql`
  3. `03_insert_data.sql`

---

## 🚀 Deploy e Publicação

O projeto está preparado para hospedagem em nuvem utilizando variáveis de ambiente para isolar as credenciais. Atualmente as URLs publicadas são:

- **Front-end (Vercel)**: [https://tdb-responde-full.vercel.app](https://tdb-responde-full.vercel.app)
- **Back-end (Render)**: [https://tdb-respondefull.onrender.com](https://tdb-respondefull.onrender.com)

**Como compilar para Produção:**
- Para o Java, gere o _Fat Jar_: `mvn clean package -DskipTests`.
- Para o React, faça o build na pasta frontend: `npm run build` (Os artefatos otimizados ficarão na pasta `dist/`).

---

## 👨‍💻 Equipe

- **Alisson Kawan** (RM: 567598)
  - [GitHub](https://github.com/AlissonKawan) | [LinkedIn](https://www.linkedin.com/in/AlissonKawan)
- **Marcos Vinicius** (RM: 567214)
  - [GitHub](https://github.com/marcos-thebest) | [LinkedIn](https://www.linkedin.com/in/marcos-vinicius-de-jesus-almeida/)
- **Eduardo Boni** (RM: 567236)
  - [GitHub](https://github.com/bonieduardo75) | [LinkedIn](https://www.linkedin.com/in/eduardo-boni-b6b851310)

---
_Documentação gerada após análise completa da estrutura monorepo do sistema._
