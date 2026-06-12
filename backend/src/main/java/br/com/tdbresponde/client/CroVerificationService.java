package br.com.tdbresponde.client;

public interface CroVerificationService {
    /**
     * Valida o CRO e UF do profissional de odontologia.
     * 
     * @param cro O número do CRO
     * @param uf A Unidade Federativa correspondente ao registro
     * @return true se o registro for válido/ativo, false caso contrário
     */
    boolean verificar(String cro, String uf);

    /**
     * Retorna o status de validacao detalhado da ultima chamada a verificar().
     * Valores comuns: "VALIDADO", "FALHA_INTEGRACAO"
     * 
     * @return O status de validacao
     */
    default String obterStatusUltimaVerificacao() {
        return "VALIDADO";
    }
}
