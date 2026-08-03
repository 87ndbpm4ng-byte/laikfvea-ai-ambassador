import type {
  PresentationAsset,
  PresentationAssetId,
} from "@/lib/presentation/presentation-types";

export const presentationAssetRegistry: Readonly<
  Record<PresentationAssetId, PresentationAsset>
> = {
  "go-bottle": {
    type: "product",
    asset: "go-bottle",
    title: "Everyday Bottle",
    alt: "The compact Everyday Bottle",
    src: "/presenter/everyday-bottle.png",
    fit: "contain",
  },
  "pro-bottle": {
    type: "product",
    asset: "pro-bottle",
    title: "Advanced Bottle",
    alt: "The Advanced Bottle",
    src: "/presenter/advanced-bottle.png",
    fit: "contain",
  },
  "go-vs-pro": {
    type: "comparison",
    asset: "go-vs-pro",
    title: "Product comparison",
    alt: "The Everyday Bottle and Advanced Bottle shown together",
    src: "/presenter/bottles-comparison.png",
    fit: "contain",
  },
  "hydrogen-water": {
    type: "infographic",
    asset: "hydrogen-water",
    title: "Hydrogen water",
    alt: "Diagram explaining molecular hydrogen in water",
    src: "/presenter/hydrogen-infographic.svg",
    fit: "contain",
  },
  "oxidative-stress": {
    type: "infographic",
    asset: "oxidative-stress",
    title: "Oxidative stress",
    alt: "Diagram explaining oxidative stress",
    src: "/presenter/oxidative-stress-infographic.svg",
    fit: "contain",
  },
  "hydrogen-process": {
    type: "infographic",
    asset: "hydrogen-process",
    title: "Hydrogen process",
    alt: "Exploded view of the membrane and electrode module",
    src: "/presenter/electrolysis-membrane.png",
    fit: "contain",
  },
  "hydrogen-inhalation": {
    type: "feature",
    asset: "hydrogen-inhalation",
    title: "Hydrogen inhalation",
    alt: "The inhalation tube and nasal cannula accessory",
    src: "/presenter/inhalation.png",
    fit: "contain",
  },
  "premium-materials": {
    type: "feature",
    asset: "premium-materials",
    title: "Premium materials",
    alt: "Detail of the bottle's clear premium vessel",
    src: "/presenter/premium-materials.png",
    fit: "contain",
  },
  mineralisation: {
    type: "feature",
    asset: "mineralisation",
    title: "Mineralisation",
    alt: "Mineralisation media used with the Advanced Bottle",
    src: "/presenter/mineralisation.jpg",
    fit: "cover",
  },
  charging: {
    type: "feature",
    asset: "charging",
    title: "Charging",
    alt: "The Advanced Bottle active with its illuminated base",
    src: "/presenter/charging.png",
    fit: "contain",
  },
  maintenance: {
    type: "feature",
    asset: "maintenance",
    title: "Care and maintenance",
    alt: "The bottle and its precision internal components",
    src: "/presenter/maintenance.png",
    fit: "contain",
  },
};

export function getPresentationAsset(assetId: PresentationAssetId) {
  return presentationAssetRegistry[assetId];
}
