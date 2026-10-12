package br.com.tdbresponde.dto;

/**
 * DTO que representa a previsão de check-in obtida pelo cliente Java do Gemini.
 * Cada campo é mapeado diretamente do JSON retornado pela IA.
 */
public class CheckinPrevisaoResponse {

    /** Categoria prevista pelo modelo (ex: "CONFIRMADO", "NAO_COMPARECERA"). */
    public String previsaoCheckin;

    /** Nível de confiança da previsão — valor entre 0 e 1 (ex: 0.66 = 66%). */
    public double confiancaCheckin;

    /** Justificativa textual dada pelo LLM. */
    public String justificativaCheckin;

    public CheckinPrevisaoResponse() {}

    public CheckinPrevisaoResponse(String previsaoCheckin, double confiancaCheckin, String justificativaCheckin) {
        this.previsaoCheckin = previsaoCheckin;
        this.confiancaCheckin = confiancaCheckin;
        this.justificativaCheckin = justificativaCheckin;
    }
}
