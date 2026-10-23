package br.com.tdbresponde.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

@Provider
public class PrivacidadeIndisponivelExceptionMapper implements ExceptionMapper<PrivacidadeIndisponivelException> {
    private static final Logger LOG = Logger.getLogger(PrivacidadeIndisponivelExceptionMapper.class);

    @Override public Response toResponse(PrivacidadeIndisponivelException exception) {
        LOG.warn("Acesso por usuário indisponível: verificar a preparação manual do schema de privacidade.");
        return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .header("Cache-Control", "no-store")
                .entity(new ErrorResponse("RECURSO_INDISPONIVEL", exception.getMessage())).build();
    }
}
