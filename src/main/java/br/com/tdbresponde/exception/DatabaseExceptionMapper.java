package br.com.tdbresponde.exception;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class DatabaseExceptionMapper implements ExceptionMapper<DatabaseException> {

    @Override
    public Response toResponse(DatabaseException exception) {
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("BANCO_DADOS", exception.getMessage()))
                .build();
    }
}
