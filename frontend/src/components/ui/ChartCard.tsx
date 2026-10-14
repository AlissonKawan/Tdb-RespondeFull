import { useEffect, useState } from 'react';
import { atendimentoService } from '../../services/atendimentoService';
import { voluntariosService } from '../../services/voluntariosService';
import { usuarioService } from '../../services/usuarioService';
import { mensagensService } from '../../services/mensagensService';



interface ChartCardProps {
  embedded?: boolean;
}

function ChartCard({ embedded = false }: ChartCardProps) {
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

        setStats(prev => ({
          ...prev,
          atendimentos: String(atends.length),
          voluntarios: String(vols.length),
          beneficiarios: String(users.filter((u) => u.tipoUsuario === 'BENEFICIARIO').length),
        }));

        // Fetch mensagens em background
        void (async () => {
          try {
            let totalMensagens = 0;
            // Pega as mensagens de até 10 atendimentos recentes para não sobrecarregar
            const recentes = atends.slice(0, 10);
            const mensagensPromises = recentes.map((a) =>
              mensagensService.getMensagensAtendimento(a.id).catch(() => [])
            );
            const todasMensagens = await Promise.all(mensagensPromises);
            totalMensagens = todasMensagens.reduce((acc, curr) => acc + curr.length, 0);

            setStats(prev => ({
              ...prev,
              mensagens: String(totalMensagens) + (atends.length > 10 ? '+' : ''),
            }));
          } catch {
            setStats(prev => ({ ...prev, mensagens: '0' }));
          }
        })();
      } catch {
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
    <div className={`${embedded ? 'border-t border-slate-200' : 'overflow-hidden rounded-3xl shadow-xl shadow-slate-950/10'} bg-slate-950 p-4 text-white sm:p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sky-300">Acolhimento em números</p>
          <h3 className="mt-1 text-base font-bold text-white">Impacto da rede</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Dados da plataforma
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" aria-live="polite">
        {[
          [stats.atendimentos, 'atendimentos'],
          [stats.mensagens, 'mensagens recentes'],
          [stats.voluntarios, 'voluntários'],
          [stats.beneficiarios, 'beneficiários'],
        ].map(([value, label]) => (
          <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.07] p-3">
            <p className="text-xl font-black tabular-nums text-white">{value}</p>
            <p className="mt-0.5 break-words text-[0.6875rem] font-medium leading-4 text-slate-300">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChartCard;
