import { ReactNode, useEffect, useState } from 'react';

import s from './Toast.module.css';

export type ToastVariant = 'info' | 'warning' | 'danger' | 'success';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

type Props = {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  variant?: ToastVariant;
  autoCloseMs?: number;
  action?: ToastAction;
  onClose: () => void;
};

export const Toast = ({
  title,
  description,
  meta,
  variant = 'info',
  autoCloseMs,
  action,
  onClose,
}: Props) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!autoCloseMs) return;

    const timer = window.setTimeout(() => {
      setIsLeaving(true);
      window.setTimeout(onClose, 200);
    }, autoCloseMs);

    return () => window.clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    window.setTimeout(onClose, 200);
  };

  return (
    <div
      role="status"
      className={[s.toast, s[`variant_${variant}`], isLeaving ? s.leaving : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={s.body}>
        <div className={s.title}>{title}</div>
        {description && <div className={s.description}>{description}</div>}
        {meta && <div className={s.meta}>{meta}</div>}
        {action && (
          <button
            type="button"
            className={s.action}
            onClick={() => {
              action.onClick();
              handleClose();
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        className={s.closeBtn}
        onClick={handleClose}
        aria-label="Закрыть"
      >
        ×
      </button>
    </div>
  );
};
