import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRanking, type RankingResponse } from '../services/voluntariosService';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';

type PodiumPlace = 1 | 2 | 3;

const podiumStyles: Record<
  PodiumPlace,
  {
    border: string;
    medal: string;
    position: string;
    surface: string;
  }
> = {
  1: {
    border: 'from-amber-500/70 via-amber-100 to-amber-700/50',
    medal: 'text-amber-600',
    position: 'col-span-2 md:col-span-1 md:col-start-2 md:row-start-1',
    surface: 'min-h-72 border-primary/10 shadow-lg shadow-primary/10 md:min-h-80',
  },
  2: {
    border: 'from-slate-400/80 via-slate-100 to-slate-500/60',
    medal: 'text-slate-500',
    position: 'md:col-start-1 md:row-start-1',
    surface: 'min-h-60 border-slate-200 md:min-h-64',
  },
  3: {
    border: 'from-orange-700/50 via-orange-100 to-orange-800/50',
    medal: 'text-orange-700',
    position: 'md:col-start-3 md:row-start-1',
    surface: 'min-h-60 border-orange-100 md:min-h-60',
  },
};

function MedalIcon({ place }: { place: PodiumPlace }) {
  return (
    <div className={`relative h-20 w-20 ${podiumStyles[place].medal}`} aria-hidden="true">
      <svg viewBox="0 0 80 88" fill="none" className="h-full w-full">
        <path d="M20 4h16l6 28-14 7L20 4Z" fill="currentColor" opacity="0.34" />
        <path d="M60 4H44l-6 28 14 7L60 4Z" fill="currentColor" opacity="0.55" />
        <circle cx="40" cy="54" r="26" fill="white" stroke="currentColor" strokeWidth="3" />
        <circle cx="40" cy="54" r="20" fill="currentColor" opacity="0.1" />
        <path
          d="m40 39 4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.8-6.6 9.4-1.4L40 39Z"
          fill="currentColor"
        />
      </svg>
      <span className="absolute inset-x-0 bottom-[1.15rem] text-center text-sm font-black text-white">
        {place}
      </span>
    </div>
  );
}

function formatPoints(points: number) {
  return `${points} ${points === 1 ? 'ponto' : 'pontos'}`;
}

function PodiumCard({ volunteer, place }: { volunteer: RankingResponse; place: PodiumPlace }) {
  const placeLabel = `${place}º lugar`;

  return (
    <li
      className={`min-w-0 self-end ${podiumStyles[place].position}`}
      aria-label={`${placeLabel}: ${volunteer.nome}, ${formatPoints(volunteer.pontosIndicacao)}`}
    >
      <div className={`rounded-[1.4rem] bg-gradient-to-br p-px ${podiumStyles[place].border}`}>
        <div
          className={`flex flex-col items-center justify-center rounded-[calc(1.4rem-1px)] border bg-white px-3 py-6 text-center shadow-sm ${podiumStyles[place].surface}`}
        >
          <MedalIcon place={place} />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {placeLabel}
          </p>
          <h3 className="mt-2 max-w-full break-words text-lg font-bold leading-tight text-foreground sm:text-xl">
            {volunteer.nome}
          </h3>
          {volunteer.especialidade?.nome && (
            <p className="mt-2 max-w-full break-words text-xs leading-5 text-muted-foreground sm:text-sm">
              {volunteer.especialidade.nome}
            </p>
          )}
          <span className="mt-4 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
            {formatPoints(volunteer.pontosIndicacao)}
          </span>
        </div>
      </div>
    </li>
  );
}

function Podium({ ranking }: { ranking: RankingResponse[] }) {
  const podium = ranking.slice(0, 3);

  return (
    <section aria-labelledby="podium-title">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Reconhecimento</p>
        <h2 id="podium-title" className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Destaques da nossa rede do bem
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Profissionais que ampliam o alcance do cuidado por meio de novas indicações.
        </p>
      </div>

      <ol
        className="mx-auto mt-8 grid min-w-0 max-w-4xl grid-cols-2 items-end gap-3 sm:gap-5 md:grid-cols-3 md:gap-6"
        aria-label="Pódio dos voluntários"
      >
        {podium.map((volunteer, index) => (
          <PodiumCard
            key={`${volunteer.codigoIndicacao}-${index}`}
            volunteer={volunteer}
            place={(index + 1) as PodiumPlace}
          />
        ))}
      </ol>
    </section>
  );
}

function RankingList({ ranking }: { ranking: RankingResponse[] }) {
  const remainingVolunteers = ranking.slice(3);

  if (remainingVolunteers.length === 0) return null;

  return (
    <Card className="mt-10 overflow-hidden p-0">
      <div className="border-b border-border bg-muted/40 px-4 py-4 sm:px-6">
        <h2 className="text-base font-bold text-foreground sm:text-lg">Outros destaques do Top 10</h2>
      </div>
      <ol className="divide-y divide-border">
        {remainingVolunteers.map((volunteer, index) => (
          <li
            key={`${volunteer.codigoIndicacao}-${index + 3}`}
            className="flex min-w-0 items-center justify-between gap-3 px-3 py-4 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-6"
          >
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                {index + 4}
              </span>
              <div className="min-w-0">
                <p className="break-words font-semibold text-foreground">{volunteer.nome}</p>
                {volunteer.especialidade?.nome && (
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    {volunteer.especialidade.nome}
                  </p>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary sm:px-3 sm:text-sm">
              {formatPoints(volunteer.pontosIndicacao)}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function BackIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  );
}

function RankingVoluntarios() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function carregarRanking() {
      try {
        setLoading(true);
        setError(null);
        const response = await getRanking(10);
        if (isActive) setRanking(response);
      } catch (requestError) {
        console.error('Erro ao carregar ranking:', requestError);
        if (isActive) setError('Não foi possível carregar o ranking de indicações.');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void carregarRanking();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/40 pb-16">
      <PageHeader
        title="Ranking de Voluntários"
        description="Acompanhe os voluntários que mais indicaram pessoas para nossa rede do bem."
        eyebrow="TDB Responde"
        align="center"
      />

      <Container className="py-8 md:py-10">
        <div className="mb-8">
          <Button variant="secondary" leftIcon={<BackIcon />} onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>

        {loading && (
          <div className="mx-auto max-w-4xl">
            <LoadingState title="Buscando as pontuações no servidor..." count={3} />
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md">
            <ErrorState title="Falha ao carregar ranking" description={error} />
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <div className="mx-auto max-w-md">
            <EmptyState
              title="Ranking vazio"
              description="Nenhum voluntário pontuou ainda. Seja o primeiro a convidar alguém!"
            />
          </div>
        )}

        {!loading && !error && ranking.length > 0 && (
          <div className="mx-auto min-w-0 max-w-5xl">
            <Podium ranking={ranking} />
            <RankingList ranking={ranking} />
          </div>
        )}
      </Container>
    </div>
  );
}

export default RankingVoluntarios;
