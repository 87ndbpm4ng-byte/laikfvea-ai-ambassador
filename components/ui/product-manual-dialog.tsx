"use client";

import { useEffect, useRef, useState } from "react";
import { productManuals, type ProductManual } from "@/lib/data/product-manuals";
import { getUiCopy } from "@/lib/i18n/ui-copy";
import type { SupportedLanguage } from "@/types/language";

type ProductManualDialogProps = {
  isOpen: boolean;
  language: SupportedLanguage;
  onClose: () => void;
};

function manualLabel(manual: ProductManual, language: SupportedLanguage) {
  const copy = getUiCopy(language);
  return manual.id === "everyday" ? copy.goUserManual : copy.proUserManual;
}

export function ProductManualDialog({
  isOpen,
  language,
  onClose,
}: ProductManualDialogProps) {
  const copy = getUiCopy(language);
  const [selectedManual, setSelectedManual] = useState<ProductManual | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  function closeDialog() {
    setSelectedManual(null);
    onClose();
  }

  if (!isOpen) return null;

  const title = selectedManual
    ? copy.viewingManual(manualLabel(selectedManual, language))
    : copy.productManuals;

  return (
    <div className="product-manual-dialog-backdrop">
      <section
        className="product-manual-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-manual-dialog-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeDialog();
          }
        }}
      >
        <header className="product-manual-dialog-header">
          <div>
            <p className="product-manual-dialog-eyebrow">{copy.productManuals}</p>
            <h2 id="product-manual-dialog-title">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="product-manual-dialog-close"
            type="button"
            onClick={closeDialog}
          >
            {copy.closeManuals}
          </button>
        </header>

        {selectedManual ? (
          <div className="product-manual-viewer">
            <button
              className="product-manual-back"
              type="button"
              onClick={() => setSelectedManual(null)}
            >
              {copy.backToManuals}
            </button>
            <iframe
              className="product-manual-frame"
              src={selectedManual.href}
              title={manualLabel(selectedManual, language)}
            />
          </div>
        ) : (
          <div className="product-manual-chooser">
            <p>{copy.productManualsSupport}</p>
            <div className="product-manual-options">
              {productManuals.map((manual) => (
                <button
                  key={manual.id}
                  type="button"
                  onClick={() => setSelectedManual(manual)}
                >
                  {manualLabel(manual, language)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
