package br.com.tdbresponde.dto;

/**
 * DTO que representa a resposta da API Python (/predict_checkin).
 * Cada campo é mapeado diretamente do JSON retornado pela IA.
 */
public class CheckinPrevisaoResponse {

    /** Categoria prevista pelo modelo (ex: "CONFIRMADO", "NAO_COMPARECERA"). */
    public String previsaoCheckin;

    /** Nível de confiança da previsão — valor entre 0 e 1 (ex: 0.66 = 66%). */
    public double confiancaCheckin;

    public CheckinPrevisaoResponse() {}

    public CheckinPrevisaoResponse(String previsaoCheckin, double confiancaCheckin) {
        this.previsaoCheckin = previsaoCheckin;
        this.confiancaCheckin = confiancaCheckin;
    }
}
