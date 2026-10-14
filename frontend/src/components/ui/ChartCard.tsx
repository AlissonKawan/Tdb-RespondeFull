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
    <div className="rounded-3xl border border-border/70 bg-surface/85 p-5 shadow-2xl shadow-primary/15 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Operação Global</p>
          <h3 className="mt-1 text-lg font-bold text-foreground">Estatísticas em Tempo Real</h3>
        </div>
        <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
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
          <div key={label} className="rounded-2xl border border-border bg-muted/50 p-3 text-center sm:text-left">
            <p className="text-xl font-black text-foreground">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>


    </div>
  );
}

export default ChartCard;
