"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { productManuals, type ProductManual } from "@/lib/data/product-manuals";
import { exhibitionProducts } from "@/lib/data/exhibition-products";
import { getUiCopy } from "@/lib/i18n/ui-copy";
import type { SupportedLanguage } from "@/types/language";

type ProductManualDialogProps = {
  isOpen: boolean;
  language: SupportedLanguage;
  onClose: () => void;
  manual?: ProductManual | null;
};

function manualLabel(manual: ProductManual, language: SupportedLanguage) {
  const copy = getUiCopy(language);
  if (manual.id === "water-ionizer") return copy.waterIonizerUserManual;
  if (manual.id === "air-purifier") return copy.airPurifierUserManual;
  if (manual.id === "air-humidifier") return copy.airHumidifierUserManual;
  return manual.id === "everyday" ? copy.goUserManual : copy.proUserManual;
}

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ProductManualDialog({
  isOpen,
  language,
  onClose,
  manual = null,
}: ProductManualDialogProps) {
  const copy = getUiCopy(language);
  const [selectedManual, setSelectedManual] = useState<ProductManual | null>(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef(createIdempotencyKey());
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const displayedManual = manual ?? selectedManual;

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  function closeDialog() {
    setSelectedManual(null);
    setEmail("");
    setConsent(false);
    setIsSubmitting(false);
    setRequestSubmitted(false);
    setRequestError(null);
    idempotencyKeyRef.current = createIdempotencyKey();
    onClose();
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayedManual || isSubmitting) return;
    setIsSubmitting(true);
    setRequestError(null);
    try {
      const response = await fetch("/api/manual-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consent,
          productId: displayedManual.id,
          language,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });
      const body = (await response.json()) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? copy.manualRequestError);
      setRequestSubmitted(true);
    } catch {
      setRequestError(copy.manualRequestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const title = displayedManual ? copy.requestManualTitle : copy.productManuals;

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

        {displayedManual ? (
          <div className="product-manual-request">
            {!manual ? (
              <button className="product-manual-back" type="button" onClick={() => setSelectedManual(null)}>
                {copy.backToManuals}
              </button>
            ) : null}
            {requestSubmitted ? (
              <p className="product-manual-request-success" role="status">{copy.manualRequestSuccess}</p>
            ) : (
              <form onSubmit={submitRequest}>
                <h3>{copy.requestManualTitle}</h3>
                <p>{copy.requestManualSupport(exhibitionProducts[displayedManual.id].displayNames[language])}</p>
                <label>
                  {copy.manualEmailLabel}
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="product-manual-consent">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                  <span>{copy.manualConsent}</span>
                </label>
                {requestError ? <p role="alert">{requestError}</p> : null}
                <button type="submit" disabled={isSubmitting || !consent}>
                  {isSubmitting ? copy.sending : copy.requestManual}
                </button>
              </form>
            )}
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
