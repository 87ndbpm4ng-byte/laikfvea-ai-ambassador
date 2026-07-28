import type { ReactNode } from "react";

type ScreenContainerProps = {
  children: ReactNode;
};

export function ScreenContainer({ children }: ScreenContainerProps) {
  return <div className="screen-container">{children}</div>;
}
