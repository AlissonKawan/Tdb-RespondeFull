package br.com.tdbresponde.security;

import jakarta.ws.rs.core.SecurityContext;
import java.security.Principal;

public record TestIdentity(int contaId, String role) implements SecurityContext {
    public Principal getUserPrincipal() { return () -> Integer.toString(contaId); }
    public boolean isUserInRole(String name) { return role.equals(name); }
    public boolean isSecure() { return true; }
    public String getAuthenticationScheme() { return "Bearer"; }
}
