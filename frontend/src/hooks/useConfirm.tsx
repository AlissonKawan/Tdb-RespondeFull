import { useCallback, useRef, useState } from 'react';
import ConfirmDialog, { type ConfirmConfig } from '../components/ui/ConfirmDialog';

export type { ConfirmConfig } from '../components/ui/ConfirmDialog';

export function useConfirm() {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setConfig(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const confirm = useCallback((options: ConfirmConfig) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfig(options);
  }, []);

  return {
    confirm,
    confirmDialog: config ? <ConfirmDialog config={config} onClose={close} /> : null,
  };
}
