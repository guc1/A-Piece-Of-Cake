'use client';
/* eslint-disable @next/next/no-img-element */

import { Button } from '@/components/ui/button';
import { addIngredientAction } from '@/app/(app)/planning/next/actions';
import type { Ingredient } from '@/types/ingredient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  return (
    <div id={`igrd-plan-list-${userId}`} className="space-y-2 p-4">
      {ingredients.map((ing) => {
        const src = iconSrc(ing.icon);
        return (
          <div
            key={ing.id}
            className="flex items-center justify-between rounded border p-2"
          >
            <Link
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
              className="bg-green-500 text-white"
              onClick={async () => {
                await addIngredientAction(date, blockId, String(ing.id), mode);
                router.push(`/planning/${mode}?date=${date}`);
              }}
            >
              +
            </Button>
          </div>
        );
      })}
      {ingredients.length === 0 && <p>No ingredients</p>}
    </div>
  );
}

