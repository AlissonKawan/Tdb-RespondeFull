package br.com.tdbresponde.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.sql.SQLException;

@Provider
public class DatabaseExceptionMapper implements ExceptionMapper<DatabaseException> {

    private static final Logger LOG = Logger.getLogger(DatabaseExceptionMapper.class);

    @Override
    public Response toResponse(DatabaseException exception) {
        LOG.error("Erro de banco de dados ao processar requisicao", exception);
        DetalheErroBanco detalhe = detalheErroBanco(exception);

        return Response.status(detalhe.status)
                .entity(new ErrorResponse(detalhe.codigo, detalhe.mensagem))
                .build();
    }

    private DetalheErroBanco detalheErroBanco(DatabaseException exception) {
        String mensagemSql = mensagemSql(exception);
        String normalizada = mensagemSql.toUpperCase();

        if (normalizada.contains("ORA-00001")) {
            return new DetalheErroBanco(
                    Response.Status.BAD_REQUEST,
                    "BANCO_DADOS_CONSTRAINT",
                    "Nao foi possivel salvar: ja existe um registro com os mesmos dados unicos."
            );
        }

        if (normalizada.contains("ORA-02291")) {
            return new DetalheErroBanco(
                    Response.Status.BAD_REQUEST,
                    "BANCO_DADOS_FK",
                    "Nao foi possivel salvar: algum ID informado nao existe no banco."
            );
        }

        if (normalizada.contains("ORA-01400") || normalizada.contains("CANNOT INSERT NULL")) {
            return new DetalheErroBanco(
                    Response.Status.BAD_REQUEST,
                    "BANCO_DADOS_CAMPO_OBRIGATORIO",
                    "Nao foi possivel salvar: existe campo obrigatorio sem valor."
            );
        }

        if (normalizada.contains("ORA-12899")) {
            return new DetalheErroBanco(
                    Response.Status.BAD_REQUEST,
                    "BANCO_DADOS_TAMANHO_CAMPO",
                    "Nao foi possivel salvar: algum texto enviado excede o tamanho permitido no banco."
            );
        }

        if (normalizada.contains("IO ERROR")
                || normalizada.contains("CONNECTION")
                || normalizada.contains("LISTENER")
                || normalizada.contains("ORA-01017")
                || normalizada.contains("ORA-12154")
                || normalizada.contains("ORA-12514")
                || normalizada.contains("ORA-12541")) {
            return new DetalheErroBanco(
                    Response.Status.SERVICE_UNAVAILABLE,
                    "BANCO_DADOS_CONEXAO",
                    "Nao foi possivel conectar ao Oracle. Verifique DB_URL, DB_USERNAME e DB_PASSWORD."
            );
        }

        return new DetalheErroBanco(
                Response.Status.INTERNAL_SERVER_ERROR,
                "BANCO_DADOS",
                "Falha ao acessar o banco de dados: " + exception.getMessage()
        );
    }

    private String mensagemSql(Throwable throwable) {
        Throwable atual = throwable;
        while (atual != null) {
            if (atual instanceof SQLException sqlException) {
                return sqlException.getMessage() != null ? sqlException.getMessage() : "";
            }
            atual = atual.getCause();
        }
        return throwable.getMessage() != null ? throwable.getMessage() : "";
    }

    private static class DetalheErroBanco {
        private final Response.Status status;
        private final String codigo;
        private final String mensagem;

        private DetalheErroBanco(Response.Status status, String codigo, String mensagem) {
            this.status = status;
            this.codigo = codigo;
            this.mensagem = mensagem;
        }
    }
}
