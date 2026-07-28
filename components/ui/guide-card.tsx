type GuideCardProps = {
  initial: string;
  name: string;
  role: string;
  focusAreas: readonly string[];
  selected: boolean;
  onSelect: () => void;
};

export function GuideCard({
  initial,
  name,
  role,
  focusAreas,
  selected,
  onSelect,
}: GuideCardProps) {
  return (
    <button
      className="guide-card"
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="guide-selection" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>

      <span className="guide-portrait" aria-hidden="true">
        {initial}
      </span>

      <span className="guide-identity">
        <span className="guide-name">{name}</span>
        <span className="guide-role">{role}</span>
      </span>

      <span className="guide-focus">
        <span className="guide-focus-label">Focus:</span>
        <span className="guide-focus-list">
          {focusAreas.map((area) => (
            <span className="guide-focus-item" key={area}>
              {area}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
