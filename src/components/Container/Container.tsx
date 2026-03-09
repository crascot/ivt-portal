import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export const Container = ({ children }: Props) => {
  return <div className="page">{children}</div>;
};
