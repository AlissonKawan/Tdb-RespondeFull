# Autenticação da aplicação

O navegador não restaura mais o usuário de `localStorage.tdb_auth_user`.
Essa chave antiga é removida. É necessário fazer login novamente após atualizar
o front-end e o back-end juntos.

## Contrato

- `POST /auth/login`: recebe e-mail/senha e devolve `{ user, token, expiresAt }`.
- `GET /auth/me`: recebe `Authorization: Bearer <token>` e devolve o usuário atual.
- `POST /auth/logout`: revoga a sessão e encerra suas conexões de chat.
- `POST /auth/ws-ticket`: recebe `{ atendimentoId }`, exige sessão e vínculo com
  o atendimento (ou administrador), e devolve um ticket de uso único válido por
  30 segundos. O token principal nunca é colocado na URL do WebSocket.
- `POST /auth/register` continua criando conta, sem autenticar automaticamente.

As sessões usam tokens aleatórios de 256 bits. O servidor guarda apenas seu hash,
identificador de conta e vencimento. A validade absoluta é de oito horas.
Cada requisição REST protegida verifica a sessão e consulta o estado/papel atual
da conta. Logout revoga imediatamente no servidor quando a chamada chega a ele.
Em falha de rede no logout, o navegador limpa sua credencial, mas a sessão no
servidor permanece válida até expirar. Usar HTTPS no ambiente publicado.

O armazenamento atual de sessões e tickets é **local à instância Java**. Reinícios
invalidam sessões. Para múltiplas réplicas, antes de escalar, substituir esse
armazenamento por um repositório compartilhado com expiração e revogação; afinidade
de sessão por si só não resolve recuperação/reinícios. Não há nova tabela nem
alteração de schema nesta implementação.

O front-end guarda a credencial em `sessionStorage` e mantém o usuário em memória,
obtido pelo login ou por `/auth/me`. Fechar a aba normalmente elimina a credencial
local; restauração de abas depende do navegador. O prazo do servidor continua
obrigatório. Scripts executados na mesma origem podem ler `sessionStorage`:
essa escolha permite usar a API em origem diferente sem cookies de terceiros,
mas exige prevenir XSS e nunca registrar tokens em logs.

## Rotas e permissões

`/` e `/portal` direcionam ao login ou ao painel do perfil validado. `/login`
não usa o cabeçalho/menu/rodapé institucional. A landing page fica em
`/institucional`; usuários autenticados nas páginas públicas são direcionados
ao painel. `/admin` exige ADMIN. URLs sem permissão retornam ao painel do perfil.
O sistema aguarda a verificação de sessão antes de renderizar conteúdo privado;
falha de rede apresenta uma opção de tentar novamente, sem liberar acesso.

O filtro REST protege por padrão os métodos dos Resources. Exceções explícitas:
login, cadastro, envio público de contato, leitura dos catálogos de especialidades
e canais, health check, ping e páginas HTML da SPA. Carregar o HTML não libera dados privados.
Usuários/alterações de voluntários/aprovação/setup/alterações dos catálogos exigem
ADMIN. Agenda, prontuário, cronograma, voluntários e leitura de contatos exigem
perfil de equipe. Nos atendimentos, a listagem geral, fila, criação direta,
atualizações, encerramento, assunção, check-in e exclusão também exigem perfil de
equipe. Este trabalho não redesenha as regras de negócio/transições de atendimento,
nem substitui a revisão de autorização por registro em todos
os endpoints legados. O chat valida o vínculo antes de emitir o ticket.

## Validação isolada

`AuthenticationHttpTest` usa `AuthTestProfile`: DAOs/BO de contas são simulados,
o datasource aponta para loopback/porta inválida, o pool inicia vazio e
`tdb.schema.init.enabled=false` impede os inicializadores de executar DDL.
Essa propriedade mantém o valor padrão anterior (`true`) fora do perfil de teste.
Nunca executar os testes de autenticação apontando para o Oracle compartilhado.

Testes de segurança cobrem sessão falsa/expirada/revogada, conta desativada,
papéis, HTTP real no Quarkus e tickets. Testes React cobrem restauração validada,
objeto local antigo, acesso por URL, logout e 401. A validação com credenciais
reais do Oracle e implantação conjunta continuam sendo etapas de homologação.
