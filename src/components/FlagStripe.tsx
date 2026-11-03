/** Faixa verde, branca e vermelha da bandeira italiana (marca Unitali). */
export default function FlagStripe({ className = '' }: { className?: string }) {
  return (
    <div className={`flex ${className}`} aria-hidden>
      <span className="flex-1 bg-flag-green" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-flag-red" />
    </div>
  );
}
