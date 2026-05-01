import { ReactNode } from 'react';

import s from './ToastContainer.module.css';

type Props = {
  children: ReactNode;
};

export const ToastContainer = ({ children }: Props) => {
  return <div className={s.container}>{children}</div>;
};
