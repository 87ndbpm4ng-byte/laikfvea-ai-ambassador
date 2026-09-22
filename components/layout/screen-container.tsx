import type { ReactNode } from "react";

type ScreenContainerProps = {
  children: ReactNode;
  fullBleed?: boolean;
};

export function ScreenContainer({
  children,
  fullBleed = false,
}: ScreenContainerProps) {
  return (
    <div className={`screen-container${fullBleed ? " screen-container--full-bleed" : ""}`}>
      {children}
    </div>
  );
}
