import { useEffect, useState } from 'react';
import { atendimentoService } from '../../services/atendimentoService';
import { voluntariosService } from '../../services/voluntariosService';
import { usuarioService } from '../../services/usuarioService';
import { mensagensService } from '../../services/mensagensService';



function ChartCard() {
  const [stats, setStats] = useState({
    atendimentos: '...',
    mensagens: '...',
    voluntarios: '...',
    beneficiarios: '...',
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [atends, vols, users] = await Promise.all([
          atendimentoService.listarTodos().catch(() => []),
          voluntariosService.listar().catch(() => []),
          usuarioService.listar().catch(() => []),
        ]);

        let totalMensagens = 0;
        // Pega as mensagens de até 20 atendimentos recentes para não sobrecarregar
        const recentes = atends.slice(0, 20);
        const mensagensPromises = recentes.map((a) =>
          mensagensService.getMensagensAtendimento(a.id).catch(() => [])
        );
        const todasMensagens = await Promise.all(mensagensPromises);
        totalMensagens = todasMensagens.reduce((acc, curr) => acc + curr.length, 0);

        setStats({
          atendimentos: String(atends.length),
          mensagens: String(totalMensagens) + (atends.length > 20 ? '+' : ''),
          voluntarios: String(vols.length),
          beneficiarios: String(users.filter((u) => u.tipoUsuario === 'BENEFICIARIO').length),
        });
      } catch (error) {
        setStats({
          atendimentos: '0',
          mensagens: '0',
          voluntarios: '0',
          beneficiarios: '0',
        });
      }
    }

    void fetchStats();
  }, []);

  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-2xl shadow-blue-950/15 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Operação Global</p>
          <h3 className="mt-1 text-lg font-bold text-[#0F172A]">Estatísticas em Tempo Real</h3>
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#059669]">
          Online
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {[
          [stats.atendimentos, 'atendimentos'],
          [stats.mensagens, 'mensagens'],
          [stats.voluntarios, 'voluntários'],
          [stats.beneficiarios, 'beneficiários'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center sm:text-left">
            <p className="text-xl font-black text-[#0F172A]">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">{label}</p>
          </div>
        ))}
      </div>


    </div>
  );
}

export default ChartCard;
