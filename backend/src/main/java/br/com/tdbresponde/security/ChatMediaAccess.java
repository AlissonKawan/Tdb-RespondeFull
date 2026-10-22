package br.com.tdbresponde.security;

import br.com.tdbresponde.dao.MensagemDAO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.SecurityContext;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

/** Novos arquivos carregam o atendimento no nome; arquivos legados usam o vinculo persistido. */
@ApplicationScoped
public class ChatMediaAccess {
    private static final String PREFIXO = "/mensagens/midia/";
    private static final Pattern NOME = Pattern.compile(
            "(?:(?<atendimento>[1-9][0-9]{0,9})-)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.(jpg|jpeg|png|webm|mp3|mp4)");
    Path diretorio = Path.of("uploads", "chat").toAbsolutePath().normalize();
    @Inject AtendimentoAccess access;
    @Inject MensagemDAO mensagens;

    public Path arquivo(String nome) {
        if (nome == null || !NOME.matcher(nome).matches()) throw new NotFoundException("Midia nao encontrada");
        return diretorio.resolve(nome);
    }

    public void autorizarLeitura(String nome, SecurityContext identity) {
        arquivo(nome);
        Integer id = atendimentoNoNome(nome);
        if (id != null) {
            access.conversar(id, identity);
            return;
        }
        var ids = mensagens.buscarAtendimentosPorArquivoUrl(PREFIXO + nome);
        for (int atendimento : ids) {
            try {
                access.conversar(atendimento, identity);
                return;
            } catch (ForbiddenException | NotFoundException denied) {
                // Outro vinculo pode conceder acesso a uma midia legada compartilhada.
            }
        }
        throw new ForbiddenException();
    }

    public void validarVinculo(String url, int atendimento, SecurityContext identity) {
        if (url == null || url.isBlank()) return;
        access.conversar(atendimento, identity);
        if (!url.startsWith(PREFIXO)) throw new BusinessException("Endereco de midia invalido");
        String nome = url.substring(PREFIXO.length());
        Path arquivo = arquivo(nome);
        Integer vinculo = atendimentoNoNome(nome);
        if (vinculo != null ? vinculo != atendimento
                : !mensagens.buscarAtendimentosPorArquivoUrl(url).contains(atendimento)) {
            throw new ForbiddenException();
        }
        if (!Files.isRegularFile(arquivo)) throw new NotFoundException("Midia nao encontrada");
    }

    private Integer atendimentoNoNome(String nome) {
        var match = NOME.matcher(nome);
        if (!match.matches() || match.group("atendimento") == null) return null;
        try {
            return Integer.valueOf(match.group("atendimento"));
        } catch (NumberFormatException invalid) {
            throw new NotFoundException("Midia nao encontrada");
        }
    }
}
