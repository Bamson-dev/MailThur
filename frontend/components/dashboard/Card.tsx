import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-section-heading text-text-heading",
        className
      )}
    >
      {children}
    </h2>
  );
}
