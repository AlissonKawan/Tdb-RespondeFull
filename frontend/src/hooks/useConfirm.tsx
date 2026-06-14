import { useState } from 'react';
import { Button } from '../components/ui/Button';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  tone?: 'danger' | 'primary' | 'success';
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  const confirm = (options: ConfirmConfig) => {
    setConfig(options);
    setIsOpen(true);
  };

  const ConfirmModal = () => {
    if (!isOpen || !config) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay escurecido */}
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
        
        {/* Modal Panel */}
        <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-slate-100">
          <h3 className="text-xl font-bold leading-6 text-slate-900 mb-2">
            {config.title}
          </h3>
          <div className="mt-2 mb-6">
            <p className="text-sm text-slate-500">
              {config.message}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setIsOpen(false)}
            >
              {config.cancelText || 'Cancelar'}
            </Button>
            {/* O Button existente provavelmente suporta variant="primary" ou similar */}
            <Button 
              variant={config.tone === 'danger' ? 'danger' : 'primary'} 
              onClick={() => {
                config.onConfirm();
                setIsOpen(false);
              }}
            >
              {config.confirmText || 'Confirmar'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmModal };
}
