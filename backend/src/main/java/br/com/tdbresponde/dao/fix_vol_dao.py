import re
import os

path = r"c:\Users\Administrator\Desktop\TDB-Responde\Tdb-RespondeFull\backend\src\main\java\br\com\tdbresponde\dao\VoluntarioDAO.java"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace in single lookups (buscarPorId, buscarPorContaId, buscarPorCodigoIndicacao)
content = re.sub(r'voluntario = mapearVoluntario\(rs\);\s*carregarEspecialidade\(voluntario\);',
                 r'voluntario = mapearVoluntario(rs);\n                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));', content)

# Replace in list lookups (buscarTodos, buscarAtivos, buscarTopRanking, buscarPendentes)
def replace_list(match):
    return """            while (rs.next()) {
                Voluntario voluntario = mapearVoluntario(rs);
                voluntarios.add(voluntario);
            }
            carregarEspecialidadesLista(voluntarios);"""

content = re.sub(r'            while \(rs\.next\(\)\) \{\s*Voluntario voluntario = mapearVoluntario\(rs\);\s*carregarEspecialidade\(voluntario\);\s*voluntarios\.add\(voluntario\);\s*\}',
                 replace_list, content)


new_method = """    private void carregarEspecialidadesLista(List<Voluntario> voluntarios) throws SQLException {
        if (voluntarios == null || voluntarios.isEmpty()) return;
        
        StringBuilder placeholders = new StringBuilder();
        for (int i = 0; i < voluntarios.size(); i++) {
            placeholders.append("?");
            if (i < voluntarios.size() - 1) placeholders.append(",");
        }
        
        String sql = "SELECT VE.VOLUNTARIO_ID, E.ID AS ESP_ID, E.NOME, E.DESCRICAO " +
                     "FROM VOLUNTARIO_ESPECIALIDADE VE " +
                     "JOIN ESPECIALIDADE E ON VE.ESPECIALIDADE_ID = E.ID " +
                     "WHERE VE.VOLUNTARIO_ID IN (" + placeholders + ")";
                     
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
             
            for (int i = 0; i < voluntarios.size(); i++) {
                stmt.setInt(i + 1, voluntarios.get(i).getId());
            }
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    int volId = rs.getInt("VOLUNTARIO_ID");
                    for (Voluntario v : voluntarios) {
                        if (v.getId() == volId) {
                            Especialidade esp = new Especialidade();
                            esp.setId(rs.getInt("ESP_ID"));
                            esp.setNome(rs.getString("NOME"));
                            esp.setDescricao(rs.getString("DESCRICAO"));
                            
                            if (v.getEspecialidades() == null) {
                                v.setEspecialidades(new ArrayList<>());
                            }
                            v.getEspecialidades().add(esp);
                            break;
                        }
                    }
                }
            }
        }
    }"""

# Remove old carregarEspecialidade and inject the new one
content = re.sub(r'    private void carregarEspecialidade\(Voluntario voluntario\) throws SQLException \{[\s\S]*?voluntario\.setEspecialidades\(especialidades\);\s*\}', new_method, content)


with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("VoluntarioDAO otimizado com sucesso!")
