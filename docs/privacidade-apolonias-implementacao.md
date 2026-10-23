# Privacidade no cadastro e no relato Apolônias

## Código preparado

- O cadastro público permite escolher o Programa Apolônias, a identificação por nome, codinome ou nome gerado e um usuário de acesso independente de e-mail. A escolha de identificação é obrigatória. No modo gerado, o backend descarta eventual nome enviado pelo cliente.
- Telefone não é solicitado no cadastro. E-mail é opcional nesse programa. As contas anteriores continuam usando o login por e-mail; o campo `email` do contrato de login aceita também o usuário, sem alterar o payload dos clientes anteriores. O usuário tem de 3 a 40 caracteres e não aceita `@`, separando os dois tipos de acesso.
- O cadastro pede confirmação com programa, identificação, acesso e e-mail. Não mostra senha na confirmação. A troca de nome real para codinome limpa o campo anterior. As credenciais não são gravadas em armazenamento do navegador pelo novo fluxo.
- No relato Apolônias, a beneficiária pode escolher a identificação novamente e acompanhar as respostas somente pela aplicação. Telefone/e-mail da conta não são copiados silenciosamente. Só os contatos explicitamente informados são incluídos no payload; este trabalho não adiciona envio de mensagens externas.
- O vínculo do atendimento continua sendo feito pela conta autenticada, validada no backend. Nome/codinome não são usados como chave de autorização.
- O boletim é opcional. `null` representa ausência de resposta, `false` representa “Não” e `true` representa “Sim”. O getter booleano legado continua disponível para regras existentes; a persistência utiliza o getter nullable.
- O botão de saída rápida fica na navegação institucional, no login, no cabeçalho do sistema, no menu móvel e nos diálogos compartilhados para continuar acessível com o modal aberto. Não confirma nem salva formulários. Remove a credencial local, emite o evento de expiração e tenta revogar a sessão com `keepalive`, sem esperar a rede, antes de `location.replace('https://www.youtube.com/')`.
- A página informa que a saída não apaga o histórico. A política `no-referrer` evita enviar a URL da aplicação como referência na navegação externa.

## Banco: execução manual autorizada, conexão pendente

O arquivo `database/23_proposta_privacidade_apolonias.sql` é uma migração manual, autorizada em conversa em 23/10/2026. Não foi executado nem incluído no startup. A tentativa de conexão com a configuração local do backend foi recusada pelo Oracle com ORA-01017, antes de qualquer consulta de metadados ou DDL. Não foi consultado ou modificado o schema real. As credenciais não foram exibidas nem gravadas no script.

O script acrescenta `USUARIO`, `TIPO_BENEFICIARIO` e `MODO_IDENTIFICACAO` em `T_CONTA_USUARIO`, cria índice único do usuário sem diferença entre maiúsculas/minúsculas e permite e-mail nulo com uma constraint que exige acesso por usuário para a conta Apolônias sem e-mail. Não utiliza e-mail fictício. Em `MULHER_APOLONIA`, permite boletim nulo, preservando os valores históricos existentes.

Após a correção de compatibilidade, login por e-mail, revalidação de sessão, listagem e cadastro anteriores não dependem dessas colunas. As consultas mantêm projeções explícitas. Se o Oracle retornar ORA-00904 nomeando uma das três colunas opcionais, somente as leituras anteriores repetem a consulta com a projeção antiga. No schema antigo isso acrescenta uma tentativa; no migrado não há segunda consulta. Não há cache da versão do schema nem alteração no banco. O mapeamento só lê os campos opcionais presentes nos metadados do resultado. O cadastro anterior insere somente as colunas anteriores. Não existe fallback que descarte os dados de privacidade de um cadastro novo.

Até a aplicação do script, o novo cadastro e acesso por usuário não estão operacionais no Oracle: retornam HTTP 503 com mensagem amigável se as colunas necessárias estiverem ausentes, inclusive em preparação parcial. Erros de conexão continuam sendo tratados como falha de banco. O script tem DDL com commit implícito e pode bloquear objetos durante sua aplicação. Foi preparado para reaplicação, verificando as colunas, o índice e as constraints já existentes e interrompendo em definições incompatíveis. Uma falha ainda pode deixar DDL parcial confirmado; o script não exclui objetos nem corrige dados automaticamente. Essa reaplicação não foi validada no Oracle devido à autenticação recusada. O responsável deve conferir o schema de destino, os dados e o backup antes de executar. O retorno ao código anterior não exige apagar as novas colunas; qualquer reversão de dados ou schema exige planejamento próprio.

Sequência de liberação: revisar e autorizar o SQL; executar de forma controlada no ambiente definido; conferir os metadados; publicar o código compatível; validar cadastro, login por usuário, login anterior por e-mail e relato em ambiente autorizado. Não executar os scripts gerais de drop/recriação para aplicar esta alteração.

## Limites e decisões pendentes

- Recuperação de senha, com ou sem contato: não há mecanismo novo nem código de recuperação. O cadastro explica essa limitação. Não foi criado um processo que permita recuperar identidade por suposição.
- Compartilhamento para encaminhamentos: não há novo endpoint, registro de consentimento ou integração externa. Finalidade, destinatários, dados indispensáveis e revogação precisam ser definidos antes dessa etapa.
- Permissões específicas do programa não foram redefinidas. As políticas existentes de conta, fila aberta, responsável, chat e mídia continuam valendo. A fila aberta permite consulta por voluntários, inclusive ao nome e aos contatos compartilhados no relato; não apresentar isso como acesso exclusivo ao profissional responsável nem como anonimato total.
- Nome escolhido para o relato não renomeia a conta. A pessoa atendida continua vinculada à conta e seu cadastro é reaproveitado nos relatos, conforme o fluxo existente.
- A saída não remove outras entradas de histórico, outras abas, arquivos baixados ou rastros de monitoramento. A revogação remota é uma tentativa; com falha de rede, não há confirmação de que o servidor a recebeu. O comportamento visual do cache de voltar/avançar do navegador não foi validado.
- Não houve teste em navegador real, teste contra Oracle nem deploy. Testes de componentes usam DOM simulado e serviços mockados. Os testes HTTP usam perfil isolado, com seed/inicialização desativados e sem Oracle real.

## Verificação

Frontend: suíte Vitest, build TypeScript/Vite e ESLint nos arquivos envolvidos. Backend: Maven com exclusão explícita de `CronogramaOracleIntegrationTest`. O teste HTTP exige valor de configuração não vazio para a chave de IA; foi usado apenas o valor fictício `isolated-test-placeholder`, sem chamada externa.

Resultado final em 23/10/2026: 177 testes do frontend e 199 testes do backend passaram, sem falhas ou testes pulados nas seleções executadas. Build TypeScript/Vite e lint direcionado dos componentes, formulários e serviços envolvidos passaram. `git diff --check` não apontou erros de whitespace. O lint completo não foi executado.

Na rodada com Maven, build e Vitest simultâneos, um teste longo de chat excedeu o timeout de cinco segundos. A suíte completa foi repetida sozinha e passou, sem aumentar timeouts nem alterar o fluxo de chat. O teste de navegação do cadastro foi atualizado para realizar a nova confirmação obrigatória.

As alterações que já existiam em `DetalheAtendimento.tsx`, `PortalVoluntario.tsx` e seu teste foram preservadas.

## Correção do incidente ORA-00904

O log publicado apontou que a consulta de login por e-mail exigia `MODO_IDENTIFICACAO` em um schema que não reconhecia a coluna. A mesma dependência existia na busca por ID, listagem e cadastro anteriores. Quatro testes reproduziram essas falhas antes da correção.

`ContaUsuarioDAO` agora recupera essas leituras com a projeção anterior apenas para ORA-00904 que identifique uma das três colunas novas. O cadastro anterior não inclui essas colunas. O novo acesso por usuário continua exigindo o recurso completo e usa `PrivacidadeIndisponivelException` e seu mapper HTTP 503. Não há alteração ou inicialização automática de banco.

Foram adicionados dez testes JDBC simulando schemas antigo, migrado e parcial, cadastro anterior e novo, resposta HTTP e preservação de falhas de conexão. `AuthenticationHttpTest` ganhou um cenário HTTP de indisponibilidade do acesso por usuário seguido de login por e-mail. A suíte final do backend passou com 210 testes, sem falhas ou testes pulados na seleção; `CronogramaOracleIntegrationTest` foi explicitamente excluído. Não houve conexão com Oracle real, execução do SQL ou deploy. Para o ambiente do log receber a correção é necessário republicar o backend corrigido.
