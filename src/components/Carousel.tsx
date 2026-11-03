import { Children, useRef, useState, type PointerEvent, type ReactNode } from 'react';

/**
 * Cards com rolagem lateral: arrasta no dedo (nativo) e com o mouse; o próximo card aparece na borda
 * e os pontos embaixo mostram quantos são e em qual está (tocar num ponto leva até o card).
 */
export default function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const items = Children.toArray(children);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);

  const cards = () => [...(ref.current?.children ?? [])] as HTMLElement[];
  // posição de rolagem que deixa o card alinhado ao início (o container tem px-4)
  const target = (el: HTMLElement) => el.offsetLeft - parseFloat(getComputedStyle(ref.current!).paddingLeft);

  function nearest() {
    const el = ref.current!;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) return items.length - 1; // fim: o último não chega a alinhar
    const list = cards().map((c) => Math.abs(target(c) - el.scrollLeft));
    return list.indexOf(Math.min(...list));
  }

  function go(i: number) {
    const c = cards()[i];
    if (c) ref.current!.scrollTo({ left: target(c), behavior: 'smooth' });
  }

  // arrastar com o mouse (no toque a rolagem nativa já faz isso)
  function down(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { x: e.clientX, left: ref.current!.scrollLeft, moved: false };
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 5) return;
    if (!d.moved) {
      d.moved = true;
      ref.current!.setPointerCapture(e.pointerId);
      ref.current!.style.scrollSnapType = 'none'; // sem o snap brigando com o arraste
    }
    ref.current!.scrollLeft = d.left - dx;
  }
  function up() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    ref.current!.style.scrollSnapType = '';
    go(nearest());
    // o clique que termina o arraste não abre o card
    ref.current!.addEventListener('click', (ev) => ev.preventDefault(), { capture: true, once: true });
  }

  return (
    <div>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        // -mx-4/px-4: os cards encostam na borda da tela ao rolar, mas começam alinhados ao conteúdo
        className="relative -mx-4 flex cursor-grab snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        onScroll={() => setActive(nearest())}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDragStart={(e) => e.preventDefault()}
      >
        {items}
      </div>
      <div className="mt-1 flex justify-center">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            className="grid h-6 w-5 place-items-center"
            aria-label={`Card ${i + 1} de ${items.length}`}
            aria-current={i === active}
            onClick={() => go(i)}
          >
            <span className={`h-2 rounded-full transition-all ${i === active ? 'w-4 bg-brand' : 'w-2 bg-slate-200 dark:bg-slate-400'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
