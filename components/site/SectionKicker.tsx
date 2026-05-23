interface SectionKickerProps {
  label: string;
  className?: string;
}

export function SectionKicker({ label, className = "" }: SectionKickerProps) {
  return <p className={`section-kicker ${className}`.trim()}>{label}</p>;
}
