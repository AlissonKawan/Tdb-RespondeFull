import { useEffect, useState } from 'react';
import { contatoService, type MensagemContatoResponse } from '../services/contatoService';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import PageShell from '../components/layout/PageShell';
import Section from '../components/layout/Section';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';

export default function MensagensContato() {
  const [contatos, setContatos] = useState<MensagemContatoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarContatos = async () => {
    setLoading(true);
    try {
      const data = await contatoService.listarMensagens();
      setContatos(data);
    } catch (error) {
      setErro('Erro ao carregar contatos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarContatos();
  }, []);

  return (
    <PageShell>
      <Section className="py-8 md:py-12">
        <SectionHeader title="Mensagens de Contato" description="Mensagens recebidas pelo site." />
        
        {loading && <LoadingState title="Carregando mensagens..." />}
        {erro && <ErrorState title="Erro ao carregar mensagens" description={erro} />}
        {!loading && !erro && contatos.length === 0 && (
          <EmptyState title="Nenhuma mensagem recebida." />
        )}

        <div className="grid gap-4 mt-6">
          {!loading && !erro && contatos.map((contato) => (
            <Card key={contato.id} className="p-4 md:p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0F172A]">{contato.nome}</h3>
                  </div>
                  <div className="mt-3 text-sm text-[#475569]">
                    <p><strong className="text-[#0F172A]">E-mail:</strong> {contato.email}</p>
                    <p><strong className="text-[#0F172A]">Data:</strong> {new Date(contato.dataEnvio).toLocaleString()}</p>
                    <p className="mt-4 text-slate-800 whitespace-pre-wrap">{contato.mensagem}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
