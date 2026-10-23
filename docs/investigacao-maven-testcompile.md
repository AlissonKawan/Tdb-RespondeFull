# Investigação de `compiler:testCompile` no Windows

Data: 23/10/2026. Escopo: somente build e testes isolados; sem acessar `.env`, iniciar Quarkus/banco, executar migrations/deploy ou alterar configuração global. O repositório atual foi mantido, sem criar worktree. O estado Git inicial estava limpo. As correções descritas em `correcoes-business-guardian.md` não foram modificadas.

## Causa imediata comprovada

Não é ausência das classes nem ausência de `target/classes` no classpath. O problema reproduzido nesta sessão é a canonicalização de caminhos pelo Java no Windows:

1. `Files.list(target/classes/br/com/tdbresponde/model)` enumera os arquivos e `Files.isRegularFile` retorna verdadeiro.
2. `javap -classpath target/classes br.com.tdbresponde.bo.AtendimentoBO` lê o bytecode.
3. `Path.toRealPath()` em `target/classes` e `Path.toRealPath(NOFOLLOW_LINKS)` no diretório do pacote lançam `java.nio.file.AccessDeniedException`.
4. `StandardJavaFileManager.list(CLASS_PATH, "br.com.tdbresponde.model", {CLASS}, false)` retorna zero classes; `getJavaFileForInput` encontra `TipoUsuario.class` diretamente.
5. Uma fonte sintética contendo apenas `br.com.tdbresponde.model.TipoUsuario` falha com `javac -cp target/classes`, inclusive sem `--release` e sem dependências.

O probe de canonicalização e enumeração reproduziu o mesmo comportamento no JBR 21.0.10 e no JDK 24.0.2. Isso isola o defeito observado do Maven, do Quarkus, das dependências e das mudanças de privacidade. Não determina, por si só, qual ACL ou componente do isolamento Windows causa a negação; nenhuma permissão foi alterada ou contornada.

## Por que a mensagem engana

O código-fonte do JDK 24 instalado (`lib/src.zip`, classe `com.sun.tools.javac.file.JavacFileManager`) mostra que `DirectoryContainer.list` retorna sem enumerar o pacote quando `caseMapCheck` falha. No Windows, esse método chama `toRealPath(NOFOLLOW_LINKS)` e captura `IOException`, retornando `false`. Assim, uma negação de acesso vira pacote aparentemente vazio e termina em `cannot find symbol`.

Já `FSInfo.getCanonicalFile` captura falhas de `toRealPath()` e usa o caminho absoluto normalizado. Portanto, ver o caminho correto no log do classpath não comprova que o compilador consegue listar seus pacotes.

Compilar fontes principais e testes juntos evita depender da descoberta das classes locais já compiladas: os símbolos são disponibilizados pelas fontes explicitamente fornecidas. Isso explica o sucesso da validação alternativa, mas não corrige o ciclo normal.

## Reprodução sem executar testes ou aplicação

No diretório `backend`, o comando abaixo percorre somente até a compilação dos testes:

```powershell
.\mvnw.cmd -B test-compile
```

A primeira execução passou com `Nothing to compile`; esse resultado foi descartado como evidência de correção. Após mover `target/test-classes` para `target/test-classes-before-diagnosis` (backup recuperável), a recompilação efetiva de 46 fontes de teste falhou com os símbolos locais ausentes. A opção `'-Dmaven.compiler.verbose=true'` confirmou `target/classes` no caminho de busca.

Um probe reproduzível, salvo temporariamente como `target/ClasspathDiagnostic.java`, pode usar apenas APIs do JDK:

```java
import java.nio.file.*;
import java.util.*;
import javax.tools.*;
class ClasspathDiagnostic {
    public static void main(String[] args) throws Exception {
        Path root = Path.of("target/classes");
        Path pkg = root.resolve("br/com/tdbresponde/model");
        try {
            System.out.println(pkg.toRealPath(LinkOption.NOFOLLOW_LINKS));
        } catch (java.io.IOException e) {
            System.out.println(e);
        }
        try (var files = Files.list(pkg)) {
            System.out.println("Arquivos enumerados: " + files.count());
        }
        try (var fm = ToolProvider.getSystemJavaCompiler()
                .getStandardFileManager(null, null, null)) {
            fm.setLocationFromPaths(StandardLocation.CLASS_PATH, List.of(root));
            int count = 0;
            for (var file : fm.list(StandardLocation.CLASS_PATH,
                    "br.com.tdbresponde.model",
                    Set.of(JavaFileObject.Kind.CLASS), false)) count++;
            System.out.println("Classes descobertas: " + count);
            System.out.println("Busca direta: " + fm.getJavaFileForInput(
                    StandardLocation.CLASS_PATH,
                    "br.com.tdbresponde.model.TipoUsuario",
                    JavaFileObject.Kind.CLASS));
        }
    }
}
```

Executar com o `java.exe` de cada JDK e o caminho do arquivo fonte; não necessita Maven, aplicação, credenciais ou conexão externa.

## Correção mínima recomendada

**Não alterar o `pom.xml` para mascarar este problema de acesso ao caminho.** Não adicionar fontes principais às fontes de teste, duplicar classes, empacotar um JAR auxiliar, atualizar dependências sem evidência, desligar checagens do compilador ou modificar ACLs/isolamento.

A menor intervenção é executar o build no mesmo repositório em um terminal legítimo do proprietário que consiga canonicalizar esse caminho. Alternativamente, um checkout em diretório oficialmente disponibilizado à sessão do agente pode ser avaliado, mas exige autorização prévia para mudar de diretório/criar worktree e não foi criado nesta tarefa. O resultado dessa intervenção ambiental ainda precisa ser validado.

Nesse contexto, verificar primeiro que o probe lista classes e não mostra `AccessDeniedException`. Depois, executar no `backend`, com Java 21 selecionado somente para aquele processo:

```powershell
.\mvnw.cmd -B clean test-compile
.\mvnw.cmd -B test '-Dtest=AtendimentoBOTest,AtendimentoSigiloTest,AtendimentoAuthorizationTest,AtendimentoResourceTest,AtendimentoAccessTest'
```

`clean` remove apenas os artefatos de `target`; preservar antes qualquer diagnóstico desejado. Não executar `mvnw test` sem seleção: a suíte contém `AuthenticationHttpTest` com `@QuarkusTest` e `CronogramaOracleIntegrationTest`, incompatíveis com as restrições desta tarefa.

## Validação desta investigação

- Recompilação real via Maven: falha reproduzida, com classpath local presente.
- Probe de acesso e descoberta: causa imediata confirmada com Java 21 e Java 24.
- Experimento com JAR local contendo apenas bytecode: também apresentou `AccessDeniedException`, no fechamento do ZipFS em ambos os JDKs; não é uma correção válida, mesmo com código de saída zero.
- Nova compilação conjunta de todas as fontes de produção e teste com `javac --release 21`, JBR 21 e classpath de dependências já disponível: sucesso. O argfile usa separadores `/`, pois barras invertidas em argfiles Java são escapes.
- `surefire:test` diretamente, selecionando apenas as cinco classes acima: **46 testes, zero falhas, zero erros, zero ignorados**. Não é aprovação do lifecycle `mvnw test`.
- O probe Java incluído neste documento foi extraído e executado com os dois JDKs: 14 arquivos enumerados, zero classes descobertas e busca direta bem-sucedida, com `AccessDeniedException` na canonicalização.
- A saída alternativa foi preservada em `target/diagnosis-all-classes`; o diretório `target/test-classes` anterior foi restaurado após os testes. Não usar os caches anteriores como evidência de build corrigido.
- Build normal corrigido e suíte completa: **não validados**, pois o acesso legítimo à canonicalização continua bloqueado nesta sessão e testes de integração/aplicação estão fora do escopo.

Somente este documento é alterado no conteúdo versionado; `pom.xml`, wrapper, fontes de produção/teste e configurações permanecem intactos. Logs, probes, argfiles e artefatos de diagnóstico ficam ignorados pelo Git.
