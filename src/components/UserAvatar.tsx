import { useState } from 'react';
import type { User } from 'firebase/auth';

/** Foto da conta Google; sem foto (ou offline), as iniciais. */
export default function UserAvatar({ user, name, className }: { user: User; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  if (user.photoURL && !failed)
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    );
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-brand font-bold text-brand-contrast ${className}`}>{initials}</span>
  );
}
