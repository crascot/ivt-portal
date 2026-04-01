import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export const Container = ({ children }: Props) => {
  return (
    <div className="page-shell">
      <div className="page">{children}</div>
    </div>
  );
};
