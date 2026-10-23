# Remoção das integrações Gemini e consulta CRO

## Escopo autorizado

Remover Gemini e consulta automática de CRO. Manter número/UF informados manualmente e conferência pelo administrador, sem migração, alteração de dados, deploy, chamadas externas ou mudança visual.

## Código e contratos

- Removidos IaClient, CheckinPrevisaoResponse e a rota GET /atendimentos/{id}/previsao-ia. Clientes antigos dessa rota precisam ser atualizados; não há resposta simulada.
- Removidos previsaoCheckin, confiancaCheckin e justificativaCheckin dos DTOs e tipos TypeScript. O frontend de produção já não chamava a previsão nem exibia o painel de IA; removido o mock obsoleto do teste, sem mudar layout.
- PUT /atendimentos/{id}/checkin mantém a autorização e a atualização manual, com projeção da resposta por perfil. O chat não é enviado ao Gemini.
- Removidos serviços real/mock/produtor de consulta CRO e testes desses serviços. ContaUsuarioBO não depende de cliente externo; mantém presença de dígitos no número e UF com dois caracteres, conforme a validação local anterior. Isso não comprova habilitação profissional.
- Novos voluntários mantêm aprovação PENDENTE, conta inativa e statusCro nulo até o fluxo administrativo existente. Número/UF são armazenados manualmente; não há resultado automático de conselho nem falha de integração fictícia. A lógica de aprovação administrativa não foi alterada.
- Removidas apenas propriedades das duas integrações em application.properties, preservando as demais. Nenhum arquivo .env foi acessado ou alterado. Valores históricos de statusCro já persistidos não foram alterados; permanecem históricos, não novas consultas.
- README e mapa operacional atualizados. Relatórios históricos e ferramentas de design em .agents/skills não são integrações da aplicação e foram preservados.

## Verificação observada

- Maven test-compile: falha em resolver classes locais, mesmo com classes de produção geradas. Não foi corrigido o build nem alterado pom.xml nesta tarefa.
- Compilação explícita conjunta de todas as fontes Java de produção e testes com javac --release 21 e classpath de dependências existentes: sucesso. O classpath foi gerado offline com dependency:build-classpath, sem instalar dependências.
- Surefire direto, após essa compilação: **76 testes, zero falhas, zero erros, zero ignorados**, nas classes VoluntarioCroTest, VoluntarioIndicacaoTest, ContaUsuarioPrivacidadeTest, ContaUsuarioVinculoTest, VoluntarioBOPontuacaoTest, AtendimentoBOTest, AtendimentoCheckinManualTest, AtendimentoSigiloTest, AtendimentoAuthorizationTest, AtendimentoResourceTest e AtendimentoAccessTest.
- Não executados AuthenticationHttpTest/Quarkus nem CronogramaOracleIntegrationTest; não foi iniciado servidor nem acessado banco. Não se afirma suíte completa ou HTTP validado.
- TypeScript tsc -b --force: sucesso.
- npm.cmd run build: TypeScript concluiu, mas Vite/esbuild falhou ao carregar vite.config.ts com Access is denied ao enumerar diretório ancestral. Vitest para DetalheAtendimento.test.tsx falhou na mesma etapa antes de executar testes. Não foram alteradas permissões, políticas, isolamento ou dependências para contornar isso. O teste frontend atualizado ainda requer execução em ambiente com acesso adequado.

## Artefatos e reprodução

Java usado somente no processo: C:/Program Files/JetBrains/IntelliJ IDEA 2025.3.4/jbr. Argumentos e classpath estão em backend/target/removal-*.args e removal-test-classpath.txt; não são versionados. Os resultados da compilação conjunta foram guardados em target/removal-validation/test-classes após os testes; a saída anterior de testes foi restaurada. A saída antiga de produção foi preservada em target/classes-before-removal-*; não deve integrar o empacotamento. Antes de distribuir, executar build limpo em ambiente autorizado para evitar artefatos antigos em target/, validar o ciclo Maven normal, Vite/Vitest e HTTP. Nenhum jar gerado foi distribuído.
