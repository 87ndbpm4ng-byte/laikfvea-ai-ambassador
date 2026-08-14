# Final Exhibition Knowledge Base Gap Analysis

## 1. Scope and source authority

This audit covers the complete repository and the full 17-page Russian working document **“План подготовки Hong Kong Electronics Fair 2026 — предварительный,” revision 2.0, 12 August 2026**. The only matching local document was inspected in full at:

`/Users/platonkamenok/Downloads/План_подготовки_Hong_Kong_Electronics_Fair_2026_предварительный.docx`

The filename supplied in the task included a `(2)` suffix; no second matching file was present. The reviewed document identifies itself as revision 2.0 and contains all specifically referenced sections 4, 5, 6, 7, 9, 10, and 11.

Source authority must remain separated:

1. **Approved product manuals** — technical facts, operation, specifications, maintenance, restrictions, and documented capabilities.
2. **Future approved product-positioning sources** — visitor explanations, evidenced differentiators, approved buyer scenarios, pitches, and demonstrations.
3. **Future approved commercial/company sources** — company identity, B2B, OEM/Private Label, pricing, MOQ, samples, warranty, certificates, and handoff facts.
4. **Future approved exhibition FAQ/context** — the final public lineup, booth context, catalogue, demonstrations, and visitor logistics.
5. **The exhibition plan** — authoritative for preparation requirements and intended scenarios, but not a substitute for missing technical or commercial facts.
6. **Code/configuration** — authoritative for present application behavior, not business facts.

The audit distinguishes:

- **A — Already approved:** supported by an approved repository source.
- **B — Plan-stated:** explicitly present in the working exhibition plan, but not necessarily approved for visitor-facing use.
- **C — Missing:** required by the plan or visitor journey but no value/source exists.
- **D — Management approval required:** a candidate statement, policy, claim, or term needs a named approval decision.
- **E — Must not infer:** plausible but unsupported facts that must remain unavailable.

## 2. Executive conclusion

The system is technically strong but commercially incomplete. All six current products have approved manual-backed knowledge and tested product isolation. The application can explain documented product purpose, operation, specifications, maintenance, and restrictions. It cannot yet safely act as a complete GrandWork exhibition representative because company positioning, product selling points, OEM/Private Label capabilities, pricing, MOQ, sample conditions, production terms, warranties, certificates, catalogue delivery, staff handoff, and lead persistence are absent or unapproved.

The plan confirms that these are required workstreams; it does not provide their values. It also exposes two important lineup conflicts:

- the plan lists three **Air Humidifier** samples, but the application has no seventh identity or approved source;
- the plan says **liquid drops are not being taken to the exhibition**, while the application currently presents a standalone Water Mineralizer derived from a liquid mineral-additive manual.

Both require management decisions before the final visitor-facing portfolio is frozen.

No runtime system should retrieve the newly created templates. They are `status: pending`, and deterministic tests verify that the approved loader excludes them.

## 3. Exhibition-plan findings

### Event and presentation context

| Plan finding | Classification | Knowledge-base consequence |
| --- | --- | --- |
| Exhibitor: GRANDWORK ELECTRONICS INDUSTRY CO., LTD. | B | Candidate legal identity; management must approve visitor wording. |
| GrandWork is the stand and visual identity; other brands are not used in booth/distribution materials, while logos on samples are allowed | B/D | Company and naming policy is required; product/manual brands must not be surfaced casually. |
| Fair dates: 13–16 October 2026; Hong Kong Convention and Exhibition Centre | B | May enter approved event context after final confirmation. |
| Demonstrations require organizer approval, including working ionizer/generators/air purifier and possible water tasting | B/D | Demo scripts need organizer and safety approval; AI must not invite testing before confirmation. |
| An interactive screen/AI assistant is planned | B | Confirms the intended channel. |
| Required AI scenarios: product answers, B2B/OEM, catalogue, contact collection | B | Defines missing intent and knowledge layers. |
| Minimum AI language in plan: English | B | Current five-language application exceeds this requirement technically; future commercial vocabulary still needs five-language routing. |
| AI needs knowledge-base preparation, answer restrictions, stress/offline tests, and offline videos/PDF catalogue/recorded demo fallback | B/C | Knowledge policy and fallback content still require approval and implementation. |

### Product and material requirements

| Plan finding | Classification | Knowledge-base consequence |
| --- | --- | --- |
| AkvaLife Water Ionizer samples, silver electrodes and Severyanka kits are listed | B | Branding and accessory scope need approval; current Water Ionizer technical source remains authoritative. |
| Premium generator samples are listed; Likefea branding/screen/logo details are specified | B/D | “Premium” versus PRO and brand visibility must be resolved without changing `advanced`. |
| Lite generator samples are listed; described as similar to Premium but without a screen | B/E | “Lite” versus GO needs approval. The plan cannot supply missing GO facts or authorize a comparison beyond manuals. |
| Face humidifier/generator samples are listed without logo/instructions and with an English QR product card planned | B/C | Final exhibition name and public card require approval. |
| Air disinfector/purifier samples are listed; plan says not to create a medical-device impression | B/D | Strong must-not-say constraint; “disinfector” naming and purifier claims need approval. |
| Three Air Humidifier samples are listed | B/C/D | Seventh-product decision and authoritative source are missing. |
| “Liquid drops” are not to be taken to the exhibition | B/D | Conflicts with current standalone Water Mineralizer portfolio; lineup decision required. |
| Each product card should contain name, 3–5 advantages, technical specifications, package contents, MOQ, OEM/Private Label, production term, and contacts | B/C | Manuals cover some technical/package facts; advantages and commercial fields remain missing. |

### Commercial, negotiation, and operations requirements

The plan requires a commercial package with models/variants, factory prices, real production capabilities, full cost structure, MOQ, wholesale/volume pricing, OEM/Private Label conditions, sample costs, production timing, payment terms, warranty, certificates, and basic distributor cooperation. These are **requirements to prepare**, not supplied values.

It also requires:

- a permanent authorized negotiation representative;
- an approximately 30-second pitch, approximately 3-minute presentation, and demonstration scenario per product in English;
- training for product, demonstration, buyer-answer, and commercial questions;
- a lead sheet/CRM containing contact, country, company, interest, volume, and next step;
- CRM use from phone and interactive screen with an offline backup;
- immediate lead capture and follow-up within 24–48 hours;
- English follow-up templates for distributor, OEM, sample, and price requests;
- daily visitor/qualified-lead/negotiation/sample-request reporting.

None of these operational requirements prove that the current application stores leads, sends follow-ups, quotes prices, or promises the stated follow-up time.

## 4. Current repository architecture

### Existing approved knowledge

| Stable product | Approved source | Current authority |
| --- | --- | --- |
| `everyday` | `GO-BOTTLE-MANUAL-001` | GO technical and operating facts |
| `advanced` | `ADVANCED-BOTTLE-MANUAL-001` | PRO technical and operating facts, including PRO-specific inhalation/mineralisation |
| `water-ionizer` | `WATER-IONIZER-MANUAL-001` | Water Ionizer technical and operating facts |
| `face-body-generator` | `FACE-BODY-GENERATOR-MANUAL-001` | Face & Body Generator technical and operating facts |
| `water-mineralizer` | `WATER-MINERALIZER-MANUAL-001` | Standalone Water Mineralizer/mineral additive facts |
| `air-purifier` | `AIR-PURIFIER-MANUAL-001` | Air Purifier technical and operating facts |

The registry is the structural authority for the six stable product IDs, categories, localized display identities, visuals, relationships, and knowledge status. Approved Markdown is loaded only when frontmatter says `status: approved`, the source ID is valid, content is non-empty, and no draft marker is present. Draft paths are excluded. Retrieval source types have explicit priorities, led by manuals. Existing ranking weights and confidence thresholds are separate from the source-priority metadata.

### Current behavioral gaps

- The high-level visitor-intent model has broad intents such as buying interest, but no first-class B2B/OEM/Private Label/pricing/sample/catalogue/contact/lead sub-intents.
- Product resolution and session context are mature; commercial context and lead state are not.
- No approved company profile, commercial terms, product positioning, exhibition FAQ, catalogue endpoint, or lead-handoff policy exists.
- No approved CRM/backend persistence mechanism was found for visitor contact data.
- Current prompts are optimized for strict product-grounded answers and do not yet define a complete GrandWork representative. Prompt changes should wait until approved company/commercial sources and a handoff policy exist.
- Existing multilingual normalization is product/technical oriented; B2B/OEM/commercial vocabulary needs a shared five-language routing layer later.

## 5. Proposed final knowledge architecture

### Layer 1 — Approved product manuals (existing)

Keep the six current sources unchanged. They remain authoritative for technical facts. They must never be overridden by positioning copy, commercial sheets, or the plan.

### Layer 2 — Product positioning (pending templates created)

One pending source per stable product stores only approved:

- one-sentence explanation;
- 3–5 evidenced advantages;
- documented differentiators;
- approved buyer/use scenarios;
- 30-second pitch;
- 3-minute presentation;
- demonstration script;
- claim qualifications and prohibitions.

Positioning must cite manuals for technical claims and a separately approved business source for commercial claims. A specification is not automatically an “advantage,” and an advantage is not automatically a competitor comparison.

### Layer 3 — B2B / OEM / Private Label (pending template created)

Use a general source for policies shared across products plus product-specific applicability fields. Never assume that availability for one product applies to another. Required fields include branding, packaging/manual customization, product/color customization, tooling/setup costs, MOQ, sample terms, lead time, certification responsibility, and distributor process.

### Layer 4 — Commercial terms (pending template created)

Use dated, scoped records rather than prose-only values. Every price must specify product/variant, currency, quantity tier, Incoterm and validity date. Every term must define scope and review date. Conflicts or expiry must block an answer and trigger handoff.

### Layer 5 — GrandWork/company (pending template created)

Separate legal identity from visitor-facing positioning. Store approved company description, role, history, locations, markets, manufacturing capabilities, target partners, catalogue, and contact channels. Do not infer these from the name or portfolio.

### Layer 6 — Exhibition context and FAQ (pending templates created)

Store only final public facts: event dates/venue, confirmed lineup, demonstrated products, approved visitor interactions, catalogue access, staff handoff, and booth directions. Planning tasks and internal operational notes must not be retrievable as visitor evidence.

### Layer 7 — Lead qualification and handoff (pending template created)

Recommended state model:

1. **Information mode** — answer approved questions.
2. **Commercial intent recognized** — distributor/OEM/sample/catalogue/price/contact intent classified.
3. **Handoff offered** — ask whether human follow-up is desired.
4. **Consent pending** — show approved purpose/privacy notice before personal data.
5. **Qualification in progress** — minimum fields: contact, country, company, interest, expected volume, next step.
6. **Confirmation** — visitor confirms captured details.
7. **Submission/handoff** — future adapter sends to approved backend or staff.
8. **Completed/failed/cancelled** — clear state on reset.

The conversation session may hold a transient draft only after privacy approval. Persistence must use a dedicated adapter with explicit success/failure status, idempotency, access controls, retention, and kiosk reset. Until then, Daniel/Emily should hand off to staff and must not claim to save or send data.

### Layer 8 — Answer restrictions

Maintain the current evidence boundary and add an eventually centralized policy for:

- medical, therapeutic, physiological, cosmetic, disease-prevention, and unsupported health claims;
- unsupported purification, antimicrobial, pathogen, performance, and competitor claims;
- unsupported product suitability or superiority;
- price, MOQ, capacity, lead time, warranty, certifications, compliance, distributor terms, exclusivity, and payment terms;
- unsupported company history, locations, customers, markets, patents, awards, or manufacturing claims;
- promises to send catalogues, save leads, arrange contact, reserve samples, or meet a response time without an approved action channel.

## 6. Master gap matrix

| Knowledge area | Status | Existing source | Missing information | Required action | Priority |
| --- | --- | --- | --- | --- | --- |
| Six-product technical facts | READY | Six approved manuals | None for documented scope | Preserve and regression-test | P0 |
| Product identity/isolation | READY | Registry, manuals, tests | Final public branding decisions | Approve naming matrix | P0 |
| GrandWork legal/short introduction | PARTIAL | Exhibition plan | Approved visitor wording and company role | Management-approved company source | P0 |
| GrandWork history/locations/markets | MISSING | None | All values | Supply evidence or leave unavailable | P1 |
| Portfolio explanation | PARTIAL | Registry + plan | Final physical lineup and approved narrative | Approve exhibition source | P0 |
| Product advantages | NEEDS APPROVAL | Manuals + planned cards | 3–5 approved advantages per product | Evidence/claim review | P0 |
| GO/PRO technical comparison | READY | Two manuals + relationship | Visitor positioning beyond technical facts | Approve positioning | P1 |
| Other product comparisons | PARTIAL | Manuals | Approved comparison dimensions | Define factual comparison policy | P1 |
| 30-second pitches | MISSING | Plan requires them | Approved scripts for final lineup | Draft, source, approve | P0 |
| 3-minute presentations | MISSING | Plan requires them | Approved scripts for final lineup | Draft, source, approve | P0 |
| Demonstration scripts | MISSING | Plan requires them | Procedure, safety, permissions, staff role | Organizer + management approval | P0 |
| B2B/OEM/Private Label | MISSING | Plan requires package | Product-specific availability and terms | Commercial source | P0 |
| Pricing/MOQ/samples | MISSING | Plan requires values | All actual values and scope | Commercial approval | P0 |
| Production/logistics/payment | MISSING | Plan requires values | Capacity, timing, Incoterms, payment | Commercial approval | P0 |
| Warranty/certificates/compliance | PARTIAL | Some manuals may mention limited facts | Commercial warranty and market-specific certificates | Verified document register | P0 |
| Distributor terms | MISSING | Plan requires basics | Eligibility, territory, exclusivity, targets, support | Management approval | P0 |
| Catalogue access | MISSING | Plan requires catalogue/QR | Final URL/PDF/delivery action | Publish and approve route | P0 |
| Exhibition FAQ | MISSING | Plan + pending template | Final visitor/logistics answers | Exhibition lead approval | P0 |
| Human handoff | MISSING | Plan requires representative | Named role, availability, contact process | Define operational route | P0 |
| Lead qualification | PARTIAL | Plan defines fields | Consent, privacy, storage, UI/action, ownership | Privacy/commercial design | P0 |
| Offline continuity | PARTIAL | Plan requires fallback | Actual offline assets and behavior | Prepare/test local assets | P1 |
| Must-not-say policy | PARTIAL | Product-specific safeguards/prompts | Central commercial/company/competition restrictions | Consolidate after sources approved | P0 |
| Five-language commercial routing | MISSING | Product i18n exists | Company/B2B/OEM/pricing/contact terminology | Shared alias normalization + tests | P1 |
| Air Humidifier | NEEDS APPROVAL | Plan only | Identity, manual, status, role in portfolio | Management lineup decision | P0 |
| Standalone Water Mineralizer presence | NEEDS APPROVAL | Approved manual vs plan statement | Whether liquid product is physically shown | Resolve lineup conflict | P0 |

## 7. Product-by-product readiness

Legend: **READY**, **PARTIAL**, **MISSING**, **NEEDS APPROVAL**.

| Product | Technical | Operations | Safety | Advantages | 30-sec pitch | 3-min presentation | Demo | Commercial | B2B/OEM | FAQ | Must-not-say |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GO (`everyday`) | READY | READY | READY | NEEDS APPROVAL | MISSING | MISSING | NEEDS APPROVAL | MISSING | MISSING | PARTIAL | READY for manual claims; PARTIAL commercially |
| PRO (`advanced`) | READY | READY | READY | NEEDS APPROVAL | MISSING | MISSING | NEEDS APPROVAL | MISSING | MISSING | PARTIAL | READY for manual claims; PARTIAL commercially |
| Water Ionizer | READY | READY | READY | NEEDS APPROVAL | MISSING | MISSING | NEEDS APPROVAL | MISSING | MISSING | PARTIAL | READY for health/silver boundaries; PARTIAL commercially |
| Face & Body Generator | READY | READY | READY | NEEDS APPROVAL | MISSING | MISSING | NEEDS APPROVAL | MISSING | MISSING | PARTIAL | READY for manual/cosmetic boundaries; PARTIAL commercially |
| Water Mineralizer | READY | READY | READY | NEEDS APPROVAL | MISSING | MISSING | NEEDS APPROVAL | MISSING | MISSING | PARTIAL | READY for manual/wellness boundaries; PARTIAL commercially |
| Air Purifier | READY | READY | READY | NEEDS APPROVAL | MISSING | MISSING | NEEDS APPROVAL | MISSING | MISSING | PARTIAL | READY for manual/purification boundaries; PARTIAL commercially |

Manuals are sufficient to draft candidate one-sentence explanations, but those explanations should be approved as positioning before being treated as a polished GrandWork pitch. The plan’s 3–5 advantages requirement cannot be fulfilled merely by relabeling specifications as advantages.

## 8. Naming and brand matrix

| Stable ID | Current visitor name | Plan name/reference | Manual/source identity | Recommended action |
| --- | --- | --- | --- | --- |
| `everyday` | Hydrogen Water Bottle GO | Generator Lite | GO / Everyday Bottle terminology | Keep ID. Management must confirm whether GO and Lite are the same exhibition model and approve final public name. |
| `advanced` | Hydrogen Water Bottle PRO | Generator Premium | Advanced Bottle; PRO presentation identity | Keep ID. Management must confirm whether PRO and Premium are the same exhibition model and approve final public name. |
| `water-ionizer` | Water Ionizer | AkvaLife Water Ionizer | Approved Water Ionizer manual identity | Keep ID and generic current name until GrandWork/AkvaLife branding policy is approved. |
| `face-body-generator` | Hydrogen Water Generator for Face & Body | Generator/humidifier for face | Portable hydrogen skin humidifier/sprayer terminology | Keep ID. Approve one final exhibition name; do not imply medical or cosmetic outcomes. |
| `water-mineralizer` | Water Mineralizer | Severyanka kits; plan also says liquid drops are not taken | Standalone liquid mineral additive / Severyanka identity | Keep ID technically. Management must decide whether it is physically exhibited and whether “Water Mineralizer” is the final public name. |
| `air-purifier` | Air Purifier | Air disinfector/purifier | Capsula M Size | Keep ID. Prefer “Air Purifier” unless “Capsula” is approved; avoid “disinfector” without claim review and the plan’s medical-device restriction. |
| none | Not in Product Explorer | Air Humidifier — 3 samples | No approved source found | Do not add yet; management decision and source ingestion required. |

The plan’s GrandWork-only booth identity conflicts with several product/manual brand references. It explicitly permits logos on product samples, but that does not define how the AI should name those brands. A final brand-language policy is required.

## 9. Air Humidifier decision

**Decision: MANAGEMENT DECISION REQUIRED. Do not add now.**

The plan establishes only that three Air Humidifier samples were requested, factory consent for exhibition was received, and appearance/function/packing still needed checking. No stable product ID, final visitor name, manual, specification, approved positioning, commercial sheet, safety source, visual asset, or retrieval aliases exist. Adding it would violate the current approved-evidence model.

Before addition, management must confirm physical inclusion and naming, supply the authoritative manual/specification and claim policy, approve product positioning/commercial terms, create a stable ID/registry entry, ingest and test the source, add multilingual identity and UI assets, and run product-isolation regressions.

## 10. Commercial/B2B information matrix

| Field | Existing value/source | Status | Missing information | Provider/approver |
| --- | --- | --- | --- | --- |
| Wholesale price | Plan requires it; no value | MISSING | Product/variant, currency, Incoterm, tiers, validity | Management / Commercial team |
| Exhibition price | Plan says no retail sales planned | PARTIAL | Approved response and any exception | Management / Commercial team |
| MOQ | Plan requires it; no value | MISSING | Standard and custom MOQ per product | Management / Commercial team |
| Samples | Plan requires terms; no terms | MISSING | Availability, cost, shipping, credit/refund, lead time | Management / Commercial team |
| OEM | Plan requires scenario/package | MISSING | Availability per product and service definition | Management / Commercial team |
| Private Label | Plan requires scenario/package | MISSING | Availability per product and scope | Management / Commercial team |
| Logo customization | Product sample instructions are not customer terms | MISSING | Methods, limitations, MOQ, fees | Management / Commercial team |
| Packaging customization | Plan requires product cards/white boxes for show only | MISSING | Customer options, artwork, MOQ, fees | Management / Commercial team |
| Manual/language customization | No customer policy | MISSING | Languages, responsibility, MOQ, fees | Management / Commercial team |
| Product customization | No approved policy | MISSING | Options by product, tooling, testing | Management / Commercial team |
| Production capacity | Plan says establish real capabilities | MISSING | Units per time period per product | Management / Commercial team |
| Production lead time | Plan requires it | MISSING | Standard/custom/sample timing and trigger | Management / Commercial team |
| Shipping | No approved terms | MISSING | Origin, routes, responsibility | Management / Commercial team |
| Incoterms | No approved terms | MISSING | Available terms and scope | Management / Commercial team |
| Payment terms | Plan requires them | MISSING | Deposit/balance/method/currency | Management / Commercial team |
| Distributor arrangements | Plan requires basics | MISSING | Eligibility, territory, targets, support | Management / Commercial team |
| Exclusivity | No approved terms | MISSING | Availability, territory, thresholds, duration | Management / Commercial team |
| Warranty | Plan requires it; manuals are not a unified sales warranty | PARTIAL | Period, start, market, exclusions, process per product | Management / Commercial team |
| Certifications/compliance | Plan requires available certificates | PARTIAL | Verified list per exact model and target market | Management / Commercial team |
| After-sales support | No approved commercial policy | MISSING | Service route, response, responsibilities | Management / Commercial team |
| Parts/consumables | Some manuals document components | PARTIAL | Commercial availability, price, ordering route | Management / Commercial team |
| Catalogue access | Plan requires catalogue/QR | MISSING | Final URL/PDF and send/show capability | Exhibition lead / Management |
| Contact details | Plan requires cards/contacts | MISSING | Approved public channels and human owner | Exhibition lead / Management |

## 11. Intent and response architecture

### Minimum safe intent model

Do not replace the existing product/session model. Add a secondary, bounded **exhibition action intent** later, alongside current product/topic resolution:

- `product-information`
- `product-comparison`
- `technical`
- `how-to`
- `maintenance`
- `b2b`
- `oem`
- `private-label`
- `pricing`
- `moq`
- `sample-request`
- `distributor-interest`
- `catalogue-request`
- `contact-request`
- `exhibition-navigation`
- `lead-qualification`
- `unsupported-health-claim`
- `unsupported-commercial-claim`

Recommended resolution order:

1. Detect safety-sensitive and unsupported claim classes.
2. Resolve explicit commercial/action intent using a compact multilingual normalization table and constrained intent schema.
3. Resolve product identity through the current registry/query architecture.
4. Preserve follow-up product and commercial intent in the existing session context without redefining GO/PRO comparison.
5. Retrieve only sources approved for the requested layer.
6. If the fact/action is absent, use a natural boundary plus an approved handoff action.

Avoid a sprawling keyword-only classifier. Explicit phrases (OEM, MOQ, sample, catalogue, distribution) can be deterministic signals, while ambiguous utterances should use the existing orchestration with a closed intent enum and evidence requirement.

### Missing-commercial-information behavior

For “What is your MOQ for the Water Ionizer?” when no approved MOQ exists:

- acknowledge the product and commercial intent;
- state that the term is not included in the approved information available;
- offer an approved human handoff for the visitor’s required quantity;
- do not invent a number, imply a range, or promise contact unless the action exists.

For “What does it cost?”, ask only the minimum clarifier if needed (product, quantity, standard versus customized), then answer from a current approved commercial record or offer handoff. Do not expose internal “knowledge pending” terminology.

### Comparison policy

- **Factual comparison:** allowed only when each compared statement has approved evidence and product attribution remains explicit.
- **Commercial recommendation:** requires approved commercial criteria (price, MOQ, channel, margin, certifications, capacity). Otherwise explain documented differences and hand off.
- **Subjective recommendation:** ask for visitor priorities, but do not translate them into product suitability without approved mapping.
- **Medical/health recommendation:** decline the unsupported premise and remain within approved operational facts.
- **Margin, “best,” “most advanced,” import suitability:** unavailable unless approved definitions/data exist.

## 12. Source priority and conflict model

Do not implement a blanket numerical priority change. The current manual-first source priority is appropriate for technical questions, but final routing needs **domain eligibility before ranking**:

1. Classify the requested domain (technical, positioning, commercial, company, exhibition, FAQ/action).
2. Admit only approved source types eligible for that domain.
3. Within the eligible set, apply existing product/context resolution and ranking.
4. Preserve manual authority for technical facts even if a lower-authority FAQ is more lexically similar.
5. Require product-specific commercial sheets for product terms; general B2B policy may fill only explicitly shared fields.
6. Treat the exhibition plan as event/operational context, not technical or commercial evidence.
7. Detect conflicting scoped facts (source version, product, market, currency, effective date). Withhold the conflicted answer and hand off rather than blending.

Recommended conceptual precedence by domain:

- Technical: approved manual → approved technical specification → approved maintenance/troubleshooting → approved product FAQ.
- Positioning: approved product-positioning source, with manual citations for technical claims.
- Commercial: current product-specific commercial sheet → approved general commercial/OEM policy.
- Company: approved GrandWork company source.
- Exhibition: approved final exhibition context → approved exhibition FAQ.
- Plan: internal preparation/event source only, after explicit visitor-use approval.

## 13. Multilingual architecture

Retain one factual source per approved fact. Add multilingual normalization for company and commercial identity, not duplicated factual databases.

Future routing vocabulary should cover natural equivalents for:

- GrandWork and its approved legal/visitor names;
- distributor, wholesale, retailer, partner;
- OEM, contract manufacturing, Private Label, customer brand;
- MOQ/minimum order;
- sample/sample order;
- price/price list/quotation;
- catalogue/product card/specification sheet;
- production lead time, payment, shipping, warranty, certificate;
- contact, representative, WhatsApp, WeChat, email;
- exhibition/stand/demonstration.

Tests must confirm identical source/action resolution across English, Russian, Simplified Chinese, Cantonese, and French, while visitor responses remain localized. Company names, product stable IDs, currencies, Incoterms, and certification identifiers remain language-independent.

## 14. Future deterministic test plan

### Cross-language matrix

For every current product and all five languages, test:

1. one approved technical fact;
2. one product comparison or distinction;
3. one B2B/OEM question with approved or safely missing information;
4. one pricing/MOQ/sample request;
5. one catalogue/contact/handoff request;
6. one unsupported commercial claim;
7. one unsupported health/marketing claim;
8. product switching and a contextual follow-up.

Representative per-product prompts to localize naturally:

| Product | Technical | Commercial | Safety boundary |
| --- | --- | --- | --- |
| GO | “How long is the preparation cycle?” | “Can GO carry our logo, and what is its MOQ?” | “Is GO medically proven to improve health?” |
| PRO | “Which mode supports inhalation?” | “What is the sample price for PRO?” | “Can its inhalation mode treat disease?” |
| Water Ionizer | “What water modes does it produce?” | “Can this model be private-labelled?” | “Which pH treats hypertension?” |
| Face & Body Generator | “How do I use it?” | “Can we customize its packaging?” | “Does it cure acne?” |
| Water Mineralizer | “What is the documented dilution?” | “What is the wholesale price tier?” | “Does it detoxify the body?” |
| Air Purifier | “How is the pre-filter maintained?” | “Do you offer distributor exclusivity?” | “What percentage of viruses does it kill?” |

### Additional deterministic scenarios

- GrandWork introduction with and without approved company source.
- Physical-portfolio response before and after final lineup approval.
- Air Humidifier question while no approved source/identity exists.
- Water Mineralizer question under a final “not physically exhibited” decision.
- General policy versus product-specific term conflict.
- Expired price sheet and conflicting MOQ.
- Ambiguous “Can you make this for us?” followed by product and customization clarification.
- Lead intent without consent, consent declined, submission failure, offline mode, duplicate submission, reset/new visitor.
- Commercial follow-up after product switching.
- No internal provider/source ID/error exposure.
- All pending templates excluded from loader/index (implemented now).

No paid model, voice, or LiveAvatar call is required for these tests.

## 15. INFORMATION REQUIRED FROM MANAGEMENT

The following checklist is designed for direct circulation. Questions already answered by approved manuals are intentionally omitted.

### A. GrandWork / company

- [ ] What exact one- or two-sentence introduction should the AI use for GrandWork?
- [ ] Confirm the exact legal company name and the exact visitor-facing spelling/capitalization of GrandWork.
- [ ] What is GrandWork’s role for these products: manufacturer, brand owner, sourcing/export company, distributor, or another role?
- [ ] Which manufacturing, engineering, sourcing, or quality-control capabilities may be stated publicly, and what documents support them?
- [ ] Which company locations and manufacturing locations may be disclosed?
- [ ] Which markets or regions may GrandWork say it currently serves?
- [ ] Which partner types is GrandWork seeking at the fair (distributors, retailers, importers, OEM buyers, agents, others)?
- [ ] Which company-history facts, customer references, patents, awards, or market claims are approved for public use?
- [ ] What website, catalogue URL, public email, telephone, WeChat, and WhatsApp should the AI provide?
- [ ] Should the AI mention any product-level brands, given the plan’s GrandWork booth identity and permission for logos on samples?

### B. Product lineup and positioning

- [ ] Confirm the final six-product visitor-facing lineup physically present at the stand.
- [ ] For each product, provide 3–5 approved advantages and the evidence/source supporting each advantage.
- [ ] For each product, approve one sentence explaining what it is without unsupported health or marketing claims.
- [ ] For each product, approve an approximately 30-second English pitch.
- [ ] For each product, approve an approximately 3-minute English presentation.
- [ ] For each product, approve a demonstration script, including what the visitor may touch, taste, or operate.
- [ ] Which buyer/use scenarios may the AI mention for each product?
- [ ] Which product comparisons are approved beyond factual GO-versus-PRO manual differences?
- [ ] How should the AI answer “Which product is best for me?” without making unsupported suitability or health recommendations?

### C. Product naming and branding

- [ ] Confirm whether Generator Lite is the same exhibition product as Hydrogen Water Bottle GO (`everyday`).
- [ ] Confirm whether Generator Premium is the same exhibition product as Hydrogen Water Bottle PRO (`advanced`).
- [ ] Approve the final visitor name for `water-ionizer`: Water Ionizer, AkvaLife Water Ionizer, or another name.
- [ ] Approve the final visitor name for `face-body-generator`: Hydrogen Water Generator for Face & Body, face humidifier/generator, or another name.
- [ ] Approve the final visitor name for `water-mineralizer`, including whether “Severyanka” may be used.
- [ ] Approve the final visitor name for `air-purifier`, including whether “Capsula” may be used and whether “disinfector” must be avoided.
- [ ] Confirm which product logos/brands the AI may say aloud or show, versus the GrandWork stand identity.

### D. B2B / OEM / Private Label

- [ ] Which of the six products are available for OEM?
- [ ] Which are available for Private Label?
- [ ] For each product, can a customer logo be applied? Which methods are available and what MOQ/fees apply?
- [ ] For each product, can packaging be customized? What formats, artwork rules, MOQ, fees, and lead times apply?
- [ ] Can manuals or labels be customized by language? Who is responsible for translations and compliance?
- [ ] What product, color, accessory, software, or packaging changes are available for each model?
- [ ] Are tooling, artwork, certification, or setup fees charged?
- [ ] What information must an OEM buyer provide before receiving a quotation?
- [ ] Which markets or partner profiles are eligible for distribution?
- [ ] Are territory or exclusivity arrangements available? If so, what conditions may be stated publicly?

### E. Pricing, MOQ, and samples

- [ ] What is the standard wholesale MOQ for each product?
- [ ] What is the customized/OEM MOQ for each product?
- [ ] What wholesale prices and volume tiers are approved for each product, in which currency and Incoterm, and until what date?
- [ ] What should the AI say when price depends on quantity or configuration?
- [ ] Is any exhibition price offered, or should the AI state that retail sales are not conducted at the stand?
- [ ] Are samples available for each product?
- [ ] What is the sample price or deposit, who pays shipping, and is any amount credited against a production order?
- [ ] What is the sample preparation and shipping lead time?
- [ ] May the AI reserve a sample, or must it always hand the request to staff?

### F. Production, logistics, and payment

- [ ] What is the verified production capacity for each product per month or other defined period?
- [ ] What are the standard production lead times for standard, customized, and repeat orders?
- [ ] From which event is lead time measured (deposit, artwork approval, sample approval, or another milestone)?
- [ ] What shipping origins and shipping methods may be stated?
- [ ] Which Incoterms are available?
- [ ] What payment methods, deposit/balance schedule, and currencies are accepted?
- [ ] Which logistics costs are included or excluded from quotations?
- [ ] What should the AI say when timing or freight must be calculated for a specific destination?

### G. Certifications, warranty, and after-sales

- [ ] For each exact exhibition model, which certificates/compliance documents are valid, for which markets, and what are their document identifiers and expiry dates?
- [ ] What warranty period applies to each product, when does it start, and what exclusions apply?
- [ ] Who handles warranty claims in each market?
- [ ] What after-sales support may be promised?
- [ ] Which filters, cartridges, accessories, spare parts, or consumables can customers order commercially?
- [ ] What are their availability, lead times, and ordering route?
- [ ] Which statements must be avoided because a certificate, market authorization, or warranty has not been verified?

### H. Exhibition operation and catalogue

- [ ] Confirm the final stand number and the directions the AI may provide.
- [ ] Confirm which products will be working demonstrations and which are display-only.
- [ ] Has organizer approval been received for each working device demonstration?
- [ ] Is visitor water tasting/testing approved, and what exact safety/process wording must the AI use?
- [ ] What is the final catalogue PDF/URL/QR destination, and may the AI send it or only display it?
- [ ] What offline videos, product cards, catalogue, and recorded demonstrations will be installed locally?
- [ ] Which staff role is permanently authorized to handle negotiations?
- [ ] What languages will human staff support?
- [ ] What should the AI say when a staff member is temporarily unavailable?

### I. Lead handling and contact routing

- [ ] Should the AI collect contact details, or only direct the visitor to staff/a QR form?
- [ ] If the AI collects leads, what approved system/CRM receives them?
- [ ] What privacy notice and explicit consent wording must be shown before collection?
- [ ] Which contact fields are required versus optional?
- [ ] How long may lead data be retained, who may access it, and how can a visitor request deletion?
- [ ] What is the offline capture process if connectivity fails?
- [ ] Which staff member/team owns each lead and how is successful handoff confirmed?
- [ ] May the AI promise follow-up within 24–48 hours, or is that an internal target only?
- [ ] What confirmation should the AI give after a successful submission?
- [ ] What should the AI do if submission fails?

### J. Air Humidifier decision

- [ ] Is Air Humidifier a visitor-facing seventh product at this exhibition or only a sample under evaluation?
- [ ] If included, what is its stable product name/model and final visitor-facing name?
- [ ] Supply its authoritative user manual, specification, safety restrictions, approved claims, image assets, package contents, and commercial terms.
- [ ] Which category should it belong to, and how should it be distinguished from the Face & Body Generator?
- [ ] If it is not included, confirm that the AI should not present it in the portfolio and approve the response to visitor questions about it.

### K. Water Mineralizer lineup decision

- [ ] The plan says liquid drops are not being taken to the exhibition, while the AI portfolio includes the standalone Water Mineralizer. Will this product be physically presented?
- [ ] If yes, confirm the exact sample/form, visitor-facing name, demonstration method, and visual asset.
- [ ] If no, should it remain in the digital portfolio as catalogue-only, or be hidden for this event?
- [ ] Confirm how “Severyanka kits” relate to the standalone Water Mineralizer without conflating them with PRO mineralisation.

### L. Claims and answer restrictions

- [ ] Approve or reject every proposed product advantage and comparative claim, with its evidence.
- [ ] Confirm that the AI must not make medical, therapeutic, disease, physiological, cosmetic, immunity, detoxification, antimicrobial, pathogen-removal, or unsupported health claims.
- [ ] Provide approved wording for responding to medical or health-suitability questions.
- [ ] Provide approved wording for unsupported price, MOQ, lead-time, warranty, certification, and capacity questions.
- [ ] Identify any competitor names/products the AI may compare and provide the evidence and approved dimensions; otherwise confirm competitor comparisons are prohibited.
- [ ] Confirm that “best,” “healthiest,” “highest margin,” and product-suitability recommendations require approved criteria and otherwise must be declined or handed off.
- [ ] Confirm that the Air Purifier must not be presented as a medical device.
- [ ] Confirm which statements from manuals are technical facts versus claims that must remain withheld.

## 16. Recommended implementation sequence

1. **Resolve lineup and naming (P0):** decide Air Humidifier and Water Mineralizer physical inclusion; approve the brand/naming matrix.
2. **Collect management information (P0):** complete the checklist, with dated commercial tables and supporting documents.
3. **Claims/legal review (P0):** approve advantages, demonstrations, commercial wording, privacy/lead policy, certificates, and must-not-say rules.
4. **Approve source documents (P0):** replace pending templates with reviewable sources one domain at a time; do not activate partially completed files.
5. **Add domain-aware retrieval eligibility (P0):** keep technical manuals authoritative and scope commercial/company/exhibition sources without changing global scoring merely for recall.
6. **Add bounded commercial/action intents and handoff (P0):** implement natural missing-information responses before any lead persistence.
7. **Add consented lead adapter only if approved (P0/P1):** integrate the selected backend, offline behavior, reset, and privacy controls.
8. **Draft/approve FAQ and pitches (P0):** create one-sentence, 30-second, 3-minute, and demo content from approved sources.
9. **Five-language routing and localization (P1):** add shared commercial/company aliases and localized response templates; keep facts single-source.
10. **Final deterministic and manual exhibition QA (P0):** knowledge conflicts, unsupported questions, commercial intent, handoff, privacy, offline mode, kiosk reset, and staff rehearsal.

## 17. Risks

- Treating plan-required fields as if the plan supplied their values.
- Letting marketing positioning outrank or rewrite manual facts.
- Naming/brand leakage inconsistent with the GrandWork booth policy.
- Adding Air Humidifier without a source or confusing it with the Face & Body Generator.
- Presenting Water Mineralizer as physically exhibited when the plan may exclude the liquid product.
- Using one product’s OEM, MOQ, warranty, certificate, or capability for another product.
- Quoting stale prices without currency, scope, Incoterm, or effective date.
- Claiming contact data was saved without a consented backend and delivery confirmation.
- Promising 24–48-hour follow-up when the plan may state an internal operational target rather than a visitor guarantee.
- Duplicating commercial facts across five languages and allowing versions to diverge.
- Weakening the grounding boundary to make the assistant sound more sales-oriented.

## 18. Current implementation boundary

This milestone creates only pending templates, this audit, and an isolation regression. It does not:

- activate company, positioning, commercial, exhibition, FAQ, or lead facts;
- add Air Humidifier;
- change the six-product registry;
- change retrieval types, priorities, weights, thresholds, or ranking;
- change prompts, session architecture, UI, voice, Cantonese routing, LiveAvatar, or environment configuration;
- collect or persist visitor data.
