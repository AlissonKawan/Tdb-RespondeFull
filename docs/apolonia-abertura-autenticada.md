# Abertura própria Apolônia autenticada

## Escopo e decisão aprovada
Reutiliza página, componentes, logo, navegação e confirmação existentes. Mulher com conta BENEFICIARIO/MULHER_APOLONIA informa apenas descrição (15–4000 caracteres), revisa o resumo e confirma. Sem repetir identificação, contato, BO, risco ou prioridade. Erro mantém descrição; sucesso limpa apenas descrição. Menores e administrador permanecem no fluxo anterior, sem redesign.

A causa exata da falha mostrada no print continua não comprovada sem banco. Schema versionado exige valores que a nova jornada legitimamente não possui. Não se transforma ausência de resposta em false nem risco/prioridade em 0/3.

## Fluxo / contrato
POST /atendimentos/relatar continua sendo a rota; para a conta Apolônia autenticada usa abertura própria. Payload novo: {"descricao":"Preciso de apoio odontológico."}. Servidor escolhe conta pela identidade, confere tipo/ativo novamente sob lock no banco. Campos antigos de cadastro/triagem são rejeitados (400); ID de outra conta e troca de tipo não são aceitos. Cliente antigo precisa atualizar; não existe fallback para o upsert que sobrescreve perfil. Perfil não Apolônia não ganha esse caminho por forjar tipo no payload. Demais contratos continuam existentes.

Transação JDBC única: SELECT da conta FOR UPDATE serializa primeiras aberturas concorrentes, busca vínculo de pessoa e reutiliza sem UPDATE, preservando contatos, identificação, BO, risco e histórico. Caso não exista pessoa, cria mínimo com nome/codinome já escolhido na conta, sem copiar email de login ou telefone; risco/BO ausentes e sigilo true. Insere pedido com prioridade NULL sempre, inclusive se perfil possui risco histórico. Sem notificações ou integrações novas. Rollback inclui perfil e pedido. Unicidade de ID_CONTA deve existir no schema (já prevista no SQL legado); script preserva índice equivalente.

Perfil duplicado, de tipo incompatível ou parcial sem detalhe Apolônia retorna conflito para revisão da equipe, sem converter tipo, preencher dados presumidos ou apagar histórico. É um bloqueio de integridade explícito, não política nova para menores. Não há deduplicação de pedidos: duas solicitações intencionais podem existir; lock impede duplicação do perfil.

## Matriz por papel verificada
| Informação/função | Beneficiário Apolônia | Responsável/menores | Voluntário | Admin | Evidência |
|---|---|---|---|---|---|
| Descrição/confirmar próprio pedido | Sim | Fluxo anterior | Não nesta jornada | Fluxo anterior | SolicitarAtendimento / Resource / BO |
| Definir risco/prioridade na abertura própria | Não | Sem alteração | Triagem interna existente | Triagem interna existente | Validação BO / projeção DTO |
| Sobrescrever perfil pela abertura própria | Não | Sem alteração | Não | Fluxo administrativo anterior | DAO sem UPDATE |
| Classificação interna na resposta beneficiária | Não | Projeção anterior | Conforme atribuição | Sim | AtendimentoResponse.paraBeneficiario |

## Representação de pendência
Integer nullable em MulherApolonia.nivelRisco e Atendimento.prioridade; JDBC setNull e wasNull; cálculo retorna NULL sem risco. BO e DTO não inventam gravidade de pessoa carregada apenas pelo JOIN. Prioridade omitida na projeção beneficiária; equipe recebe ausência, detalhe mostra Não avaliada e não grava 3 ao trocar somente status. Lista SQL explicita NULLS LAST como ordenação técnica já equivalente ao Oracle ASC, não avaliação nem protocolo de urgência. Portal de voluntário já mostrava Não informada para ausente e não classifica como urgente. Fluxo de atualização interna existente permite avaliação explícita; não é criado algoritmo de triagem.

## Implantação manual — bloqueada até responsável executar
1. Revisar diff, testes e contrato; sem commit/deploy feito nesta tarefa.
2. Em ambiente autorizado com dados sintéticos validar Maven normal, Vite/Vitest e HTTP autenticado (401/403/400, sucesso, conflito), inclusive concorrência real de duas primeiras aberturas. Os mocks comprovam uso de lock/transação; não substituem teste de concorrência Oracle.
3. Janela sem escritas, backup consistente com restauração ensaiada e metadados/SCN guardados pelo DBA. Não colocar backup sensível no repositório.
4. Revisar docs/sql/apolonia-abertura-pendente.sql: preflight, bloquear duplicidades sem apagá-las, conferir defaults/checks/nulabilidade contra schema real. Executar manualmente apenas após nova autorização operacional. DDL Oracle tem commit implícito.
5. Aplicar schema permissivo antes de subir backend e frontend juntos. Sem migrations/startup automáticos. Schema antigo pode impedir abertura; não há fallback com dado fictício.
6. Smoke sintético: primeira abertura, perfil existente inalterado, perfil parcial em conflito, pendências reais, ordem/lista, assumir/status sem triagem automática, projeção beneficiária sem risco/prioridade; admin e menores preservados.
7. Rollback: suspender escritas, reverter aplicação, preservar pedidos novos. Se já houver NULLs, NÃO restaurar NOT NULL preenchendo valores artificiais; manter schema permissivo ou planejar restauração com DBA sem perda. Instruções condicionais no SQL. Não remover unicidade preexistente.

## Verificação / limitações
- Maven offline test-compile reproduziu cannot find symbol de classes locais na fase de testes; não se alega ciclo normal corrigido. Produção compilou. Sem alterar pom, permissões ou isolamento.
- Classpath regenerado offline com dependency:build-classpath, verificado não vazio; javac --release 21 compilou produção e todos os testes juntos em target/apolonia-validation/test-classes. JDK C:/Program Files/JetBrains/IntelliJ IDEA 2025.3.4/jbr. Argfile target/apolonia.args; classpath target/apolonia-classpath.txt.
- Surefire direto selecionado: **86 testes, zero falhas, zero erros, zero ignorados**, sem Quarkus/HTTP/banco: resultados finais em target/apolonia-tests.log e surefire-reports. Saída anterior de test-classes restaurada; compilação controle permanece isolada. Não distribuir target antigo; build de distribuição deve ser feito em ambiente autorizado sem artefatos residuais, conforme docs/remocao-integracoes-gemini-cro.md.
- TypeScript tsc -b --force passou. Vite build e Vitest não executam por Access is denied no esbuild ao enumerar ancestral para vite.config.ts. Nenhuma tentativa de contornar ACL/isolamento. Testes de UI adicionados, mas ainda precisam execução em ambiente suportado. Sem screenshot executável validado.
- Não acessados .env/segredos/dados reais, banco, servidor Quarkus, migrations ou integrações. Sem instalação, commit, push/deploy ou configuração global.

## Arquivos alterados
- Backend produção: bo/AtendimentoBO.java; dao/AtendimentoDAO.java, MulherApoloniaDAO.java, PessoaAtendidaDAO.java; dto/AtendimentoResponse.java; model/Atendimento.java, MulherApolonia.java; resource/AtendimentoResource.java; security/AtendimentoAccess.java (sob backend/src/main/java/br/com/tdbresponde/).
- Backend testes: bo/ApoloniaAberturaTest.java; dao/ApoloniaAberturaDAOTest.java; resource/AtendimentoAuthorizationTest.java (sob backend/src/test/java/br/com/tdbresponde/).
- Frontend: src/pages/SolicitarAtendimento.tsx, DetalheAtendimento.tsx, __tests__/SolicitarAtendimento.test.tsx; src/services/relatoAtendimentoService.ts.
- Documentação: este arquivo e docs/sql/apolonia-abertura-pendente.sql.

## Reprodução dos controles (sem instalação)
No backend, JAVA_HOME apenas no processo para o JDK acima:
1. ./mvnw.cmd -o -B -ntp test-compile (falha de descoberta documentada).
2. ./mvnw.cmd -o -B -ntp dependency:build-classpath '-Dmdep.outputFile=target/apolonia-classpath.txt' '-Dmdep.includeScope=test'.
3. Conferir arquivo não vazio, argfile UTF-8 sem BOM com classpath e caminhos /, todas as fontes explícitas; javac.exe '@target/apolonia.args'.
4. Preservar target/test-classes, colocar temporariamente o diretório de controle nessa posição, executar Surefire direto e restaurar saída anterior em finally. Não executar lifecycle nem clean.
5. Seleção: ApoloniaAberturaTest,ApoloniaAberturaDAOTest,AtendimentoBOTest,AtendimentoCheckinManualTest,AtendimentoSigiloTest,AtendimentoAuthorizationTest,AtendimentoResourceTest,AtendimentoAccessTest,MulherApoloniaPrivacidadeDAOTest,AtendimentoPerformanceDAOTest,ContaUsuarioPrivacidadeTest,ContaUsuarioVinculoTest,RelatoPrivacidadeTest,AtendimentoVinculosAuthorizationTest.
No frontend: node_modules/.bin/tsc.cmd -b --force; npm.cmd run build; node_modules/.bin/vitest.cmd run src/pages/__tests__/SolicitarAtendimento.test.tsx src/pages/__tests__/DetalheAtendimento.test.tsx.
