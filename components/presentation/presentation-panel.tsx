"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getPresentationAsset } from "@/lib/presentation/asset-registry";
import type { Presentation } from "@/lib/presentation/presentation-types";

type PresentationPanelProps = {
  presentation: Presentation | null;
};

export function PresentationPanel({ presentation }: PresentationPanelProps) {
  const [displayed, setDisplayed] = useState<Presentation | null>(presentation);
  const [isVisible, setIsVisible] = useState(Boolean(presentation));

  useEffect(() => {
    if (presentation?.asset === displayed?.asset) {
      return;
    }

    let transition: number | undefined;
    const exitFrame = window.requestAnimationFrame(() => {
      setIsVisible(false);
      transition = window.setTimeout(() => {
        setDisplayed(presentation);
        setIsVisible(Boolean(presentation));
      }, displayed ? 180 : 0);
    });

    return () => {
      window.cancelAnimationFrame(exitFrame);
      if (transition !== undefined) {
        window.clearTimeout(transition);
      }
    };
  }, [displayed, presentation]);

  if (!displayed) {
    return null;
  }

  const asset = getPresentationAsset(displayed.asset);

  return (
    <figure
      className="presentation-panel"
      data-visible={isVisible}
      data-presentation-type={displayed.type}
      aria-label={`Now showing: ${asset.title}`}
    >
      <div className="presentation-panel-image">
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes="(max-width: 767px) 92vw, (max-width: 1180px) 38vw, 25vw"
          style={{ objectFit: asset.fit }}
        />
      </div>
      <figcaption>
        <span>Now showing</span>
        <strong>{asset.title}</strong>
      </figcaption>
    </figure>
  );
}
