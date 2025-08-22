'use client';
/* eslint-disable @next/next/no-img-element */

import { Button } from '@/components/ui/button';
import { addIngredientAction } from '@/app/(app)/planning/next/actions';
import type { Ingredient } from '@/types/ingredient';
import type { PlanBlock } from '@/types/plan';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/back-button';

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

export default function IngredientsForPlanningClient({
  userId,
  date,
  blockId,
  ingredients,
  mode,
}: {
  userId: string;
  date: string;
  blockId: string;
  ingredients: Ingredient[];
  mode: 'live' | 'next';
}) {
  const router = useRouter();
  const storageKey = `${mode}-plan-${userId}-${date}`;
  return (
    <div id={`igrd-plan-list-${userId}`} className="space-y-2 p-4">
      <BackButton id={`igrd-plan-list-back-${userId}`} />
      {ingredients.map((ing) => {
        const src = iconSrc(ing.icon);
        return (
          <div
            key={ing.id}
            className="flex items-center justify-between rounded border p-2"
          >
            <Link
              id={`igrd-plan-view-${ing.id}-${userId}`}
              href={`/ingredient/${ing.id}`}
              className="flex items-center gap-2"
            >
              {src ? (
                <img src={src} alt="" className="h-6 w-6" />
              ) : (
                <span>{ing.icon}</span>
              )}
              <span>{ing.title}</span>
            </Link>
            <Button
              id={`igrd-plan-add-${ing.id}-${userId}`}
              className="bg-green-500 px-3 text-xl text-white"
              onClick={async () => {
                await addIngredientAction(date, blockId, String(ing.id)).catch(() => {});
                try {
                  const raw = window.localStorage.getItem(storageKey);
                  const blocks: PlanBlock[] = raw ? JSON.parse(raw) : [];
                  const updated = blocks.map((b) =>
                    b.id === blockId
                      ? {
                          ...b,
                          ingredientIds: b.ingredientIds?.includes(Number(ing.id))
                            ? b.ingredientIds
                            : [...(b.ingredientIds ?? []), Number(ing.id)],
                        }
                      : b,
                  );
                  window.localStorage.setItem(storageKey, JSON.stringify(updated));
                } catch {
                  // ignore
                }
                router.push(`/planning/${mode}?date=${date}`);
              }}
            >
              +
            </Button>
          </div>
        );
      })}
      {ingredients.length === 0 && (
        <p id={`igrd-plan-none-${userId}`}>No ingredient found</p>
      )}
    </div>
  );
}

