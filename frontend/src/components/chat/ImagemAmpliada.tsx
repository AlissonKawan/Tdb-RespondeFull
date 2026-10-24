import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AtendimentoIcon from '../atendimento/AtendimentoIcon';
import { lockBodyScroll } from '../../utils/scrollLock';

interface ImagemAmpliadaProps {
  src: string;
  legenda?: string;
  onClose: () => void;
}

const controleClass = 'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none';

export default function ImagemAmpliada({ src, legenda, onClose }: ImagemAmpliadaProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imagemContainerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockBodyScroll();
    
    dialog.showModal();
    // O painel do atendimento troca de modo neste breakpoint e pode abrir
    // outro dialog. A imagem deve continuar à frente durante essa transição.
    const viewport = window.matchMedia('(min-width: 1280px)');
    const manterImagemVisivel = () => {
      dialog.close();
      dialog.showModal();
    };
    viewport.addEventListener('change', manterImagemVisivel);
    return () => {
      viewport.removeEventListener('change', manterImagemVisivel);
      dialog.close();
      unlock();
      if (anterior?.isConnected) anterior.focus({ preventScroll: true });
    };
  }, []);

  const ajustarImagem = () => {
    setZoom(1);
    const container = imagemContainerRef.current;
    if (container) {
      container.scrollLeft = 0;
      container.scrollTop = 0;
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-foreground p-0 text-primary-foreground open:flex open:flex-col"
      onCancel={event => { event.preventDefault(); onClose(); }}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-primary-foreground/15 px-2 py-2 sm:px-4">
        <button type="button" onClick={onClose} className={controleClass} aria-label="Voltar à conversa">
          <AtendimentoIcon name="back" />
          <span>Voltar<span className="hidden sm:inline"> à conversa</span></span>
        </button>
        <h2 id={titleId} className="text-sm font-semibold">Imagem da conversa</h2>
        <button type="button" onClick={onClose} className={controleClass} aria-label="Fechar imagem">
          <AtendimentoIcon name="close" />
        </button>
      </header>

      <div ref={imagemContainerRef} tabIndex={0} aria-label="Imagem ampliada; use as setas para percorrer quando houver zoom" className="min-h-0 flex-1 overflow-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-foreground">
        <div className="flex items-center justify-center p-3 sm:p-6" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <img src={src} alt="Imagem ampliada da conversa" className="h-full w-full object-contain" />
        </div>
      </div>

      <footer className="shrink-0 border-t border-primary-foreground/15 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {legenda?.trim() && <p className="mx-auto mb-2 max-h-20 max-w-3xl overflow-y-auto whitespace-pre-wrap break-words text-center text-sm leading-6">{legenda}</p>}
        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Controles de zoom">
          <button type="button" className={controleClass} disabled={zoom === 1} onClick={() => setZoom(atual => Math.max(1, atual - 0.5))} aria-label="Reduzir imagem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M5 12h14" /></svg>
          </button>
          <output className="min-w-12 text-center text-sm tabular-nums" aria-live="polite" aria-label="Zoom da imagem">{zoom * 100}%</output>
          <button type="button" className={controleClass} disabled={zoom === 3} onClick={() => setZoom(atual => Math.min(3, atual + 0.5))} aria-label="Ampliar imagem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
          </button>
          <button type="button" className={controleClass} onClick={ajustarImagem}>Ajustar à tela</button>
        </div>
      </footer>
    </dialog>,
    document.body,
  );
}
