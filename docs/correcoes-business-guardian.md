# Correções de negócio e privacidade

## Escopo autorizado

Corrigir os achados NEG-001 a NEG-006 preservando identidade visual, sem executar banco, deploy ou dados reais. Alterações visuais aguardam imagem de referência. O banco em execução não foi consultado; as observações abaixo são do schema versionado e não comprovam o schema implantado.

## Implementado nesta etapa

- NEG-001: respostas de lista e detalhe para voluntário não atribuído usam resumo de lista positiva (atendimento, status, programa, prioridade interna e data de abertura), sem pessoa, contatos ou relato. Administrador e voluntário atribuído conservam os detalhes autorizados.
- NEG-002: assumir atendimento chama a regra existente de disponibilidade e acesso a sigilo antes de modificar o atendimento. Permissão ausente ou falsa não autoriza caso restrito. Essa verificação não registra nomes em stdout.
- NEG-005: respostas de acompanhamento do beneficiário omitem prioridade e gravidade na serialização, não incluem cadastro completo do voluntário nem indicadores internos de check-in. O endpoint separado de previsão de IA nega beneficiário antes de acionar a integração.
- Testes unitários adicionais usam modelos sintéticos e DAOs/BOs simulados, sem inicializar Quarkus ou consultar banco.

## Pendências que não devem ser mascaradas com valores padrão

### NEG-003: solicitante, pessoa atendida e histórico

O schema de database/02_create_tables.sql define UK_PESSOA_ATENDIDA_CONTA como UNIQUE(ID_CONTA). O DAO atual reutiliza a pessoa dessa conta e atualiza atributos/subtipo ao receber relato.

Proposta para revisão: permitir múltiplas pessoas por conta solicitante com vínculo explícito, selecionar/criar a pessoa por solicitação de modo autorizado e preservar os atributos históricos pertinentes. Isso implica rever a unicidade de ID_CONTA ou introduzir uma associação própria, contratos de criação/consulta e regras de acesso de dependentes. Não remover a constraint isoladamente: buscarPessoaIdPorConta retorna apenas o primeiro resultado e continuaria ambíguo. A migração precisa de desenho revisado, verificação do schema implantado, backup, plano de reversão e scripts SQL aprovados. Não inferir retroativamente parentesco ou identidade de registros existentes. Nenhum SQL foi executado e nenhum mecanismo de startup foi criado.

### NEG-004: triagem pendente

O schema versionado exige NIVEL_RISCO e GRAVIDADE_BUCAL não nulos entre 1 e 5; PRIORIDADE é não nula com padrão 3. A API/modelo não representa avaliação pendente de forma explícita.

Proposta para revisão: representar ausência de avaliação separadamente dos valores clínicos e da ordenação operacional; usar atributos anuláveis e/ou estado explícito de triagem, definir operador habilitado e registrar revisão. Atualizar modelos, DTOs, mapeamento JDBC e testes antes de retirar os campos do formulário. Não converter silenciosamente todo caso antigo em avaliado nem registrar 3 como avaliação humana. Não usar risco clínico automático para prometer prazo de acolhimento. Banco e interface permanecem pendentes.

### NEG-006: acolhimento de menores

Escola e responsável são anuláveis no schema versionado, mas a UI exige ambos e o BO exige responsável. Idade é obrigatória no banco. Remover a exigência de escola não demanda, por si só, mudar essa coluna. A exceção para responsável indisponível/inseguro precisa de encaminhamento humano definido pela equipe qualificada, sem interpretar ausência como autorização para tratamento. A mudança de campos e mensagens aguarda referência visual; nenhuma regra clínica/jurídica foi inventada.

## Validação executada

- Compilação explícita de todas as fontes Java de produção e teste com javac --release 21: sucesso, usando o Java 21 já instalado no JBR do IntelliJ, sem mudar JAVA_HOME global.
- JUnit/Surefire focado: 46 testes, zero falhas, zero erros, zero ignorados. Classes executadas: AtendimentoBOTest (8), AtendimentoSigiloTest (4), AtendimentoAuthorizationTest (13), AtendimentoResourceTest (4), AtendimentoAccessTest (17).
- O ciclo normal mvnw test falhou em compiler:testCompile, sem resolver classes locais; repetido com Java 24 e 21 e compilador separado. Não foi alterado o pom nem afirmado que a suíte completa passou. A validação alternativa usou dependency:build-classpath, javac para compilar fontes e testes juntos e surefire:test para executar somente as cinco classes acima. Arquivos auxiliares ficaram em target/, sem versionar.
- Nenhum servidor Quarkus, banco, migração, integração externa de atendimento ou deploy foi iniciado pelos testes selecionados. Maven recuperou dependências já declaradas no projeto; nenhuma dependência foi adicionada ao manifesto.
- A validação HTTP, visual e a suíte completa permanecem pendentes. Casos existentes não foram reatribuídos nem tiveram dados reparados.

## Contratos e regressão

A fila não deve depender de identidade, relato ou contatos para funcionar. As telas existentes possuem fallbacks, mas a redação desses estados e o fluxo visual devem ser validados com referência antes de publicação. Prioridade continua disponível à equipe, não ao beneficiário. O recurso de chat continua exigindo vínculo; a projeção de resumo não concede acesso a mensagens.

Antes de deploy, executar testes de autorização/DTO/BO, teste HTTP isolado de serialização, build e testes do front-end, e revisão visual das telas com respostas minimizadas. Validar lista, detalhe, atribuição, contatos, agenda e prontuário. Não rodar testes de integração contra dados reais.
