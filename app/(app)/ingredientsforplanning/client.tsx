'use client';
/* eslint-disable @next/next/no-img-element */

import { Button } from '@/components/ui/button';
import { addIngredientAction } from '@/app/(app)/planning/next/actions';
import type { Ingredient } from '@/types/ingredient';
import { useRouter } from 'next/navigation';

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
}: {
  userId: string;
  date: string;
  blockId: string;
  ingredients: Ingredient[];
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
            <div className="flex items-center gap-2">
              {src ? (
                <img src={src} alt="" className="h-6 w-6" />
              ) : (
                <span>{ing.icon}</span>
              )}
              <span>{ing.title}</span>
            </div>
            <Button
              className="bg-green-500 text-white"
              onClick={async () => {
                await addIngredientAction(date, blockId, String(ing.id));
                router.push(`/planning/next?date=${date}`);
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

