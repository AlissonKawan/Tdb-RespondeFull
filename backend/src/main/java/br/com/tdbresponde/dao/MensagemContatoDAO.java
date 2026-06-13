package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.MensagemContato;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class MensagemContatoDAO {

    @Inject
    DataSource dataSource;

    public void inserir(MensagemContato mensagem) {
        String sql = "INSERT INTO T_MENSAGEM_CONTATO (NOME, EMAIL, MENSAGEM, CLASSIFICACAO_IA, LIDA) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID_MENSAGEM_CONTATO"})) {

            stmt.setString(1, mensagem.getNome());
            stmt.setString(2, mensagem.getEmail());
            stmt.setString(3, mensagem.getMensagem());
            stmt.setString(4, mensagem.getClassificacaoIA());
            stmt.setInt(5, mensagem.isLida() ? 1 : 0);

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    mensagem.setId(rs.getInt(1));
                }
            }

        } catch (SQLException e) {
            // Se a tabela não existir, podemos tentar contornar ou apenas relatar o erro
            throw new DatabaseException("Erro ao inserir mensagem de contato: " + e.getMessage(), e);
        }
    }

    public List<MensagemContato> listar() {
        String sql = "SELECT ID_MENSAGEM_CONTATO, NOME, EMAIL, MENSAGEM, DATA_ENVIO, CLASSIFICACAO_IA, LIDA " +
                "FROM T_MENSAGEM_CONTATO ORDER BY DATA_ENVIO DESC";

        List<MensagemContato> mensagens = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                MensagemContato m = new MensagemContato();
                m.setId(rs.getInt("ID_MENSAGEM_CONTATO"));
                m.setNome(rs.getString("NOME"));
                m.setEmail(rs.getString("EMAIL"));
                m.setMensagem(rs.getString("MENSAGEM"));
                
                Timestamp dataEnvio = rs.getTimestamp("DATA_ENVIO");
                if (dataEnvio != null) {
                    m.setDataEnvio(dataEnvio.toLocalDateTime());
                }
                
                m.setClassificacaoIA(rs.getString("CLASSIFICACAO_IA"));
                m.setLida(rs.getInt("LIDA") == 1);
                
                mensagens.add(m);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar mensagens de contato: " + e.getMessage(), e);
        }

        return mensagens;
    }
}
