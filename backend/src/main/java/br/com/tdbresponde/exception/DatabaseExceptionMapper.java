package br.com.tdbresponde.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

@Provider
public class DatabaseExceptionMapper implements ExceptionMapper<DatabaseException> {

    private static final Logger LOG = Logger.getLogger(DatabaseExceptionMapper.class);

    @Override
    public Response toResponse(DatabaseException exception) {
        LOG.error("Erro de banco de dados ao processar requisicao", exception);

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(
                        "BANCO_DADOS",
                        "Falha ao acessar o banco de dados. Verifique a conexao Oracle e consulte o log do backend."
                ))
                .build();
    }
}
