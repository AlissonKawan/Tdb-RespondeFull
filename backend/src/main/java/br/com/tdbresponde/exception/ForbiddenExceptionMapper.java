package br.com.tdbresponde.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ForbiddenExceptionMapper implements ExceptionMapper<ForbiddenException> {
    @Override
    public Response toResponse(ForbiddenException exception) {
        return Response.status(Response.Status.FORBIDDEN)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .header("Cache-Control", "no-store")
                .entity(new ErrorResponse("ACESSO_NEGADO", exception.getMessage())).build();
    }
}
