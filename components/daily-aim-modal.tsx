'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Ingredient } from '@/types/ingredient';

interface Props {
  userId: string;
  date: string;
  mode: 'live' | 'next';
  dailyAim: string;
  setDailyAim: (val: string) => void;
  dailyIngredientIds: number[];
  removeDailyIngredient: (id: number) => void;
  initialIngredients: Ingredient[];
  editable: boolean;
  viewId?: string | null;
  iconSrc: (ic: string) => string | null;
  onClose: () => void;
}

export default function DailyAimModal({
  userId,
  date,
  mode,
  dailyAim,
  setDailyAim,
  dailyIngredientIds,
  removeDailyIngredient,
  initialIngredients,
  editable,
  viewId,
  iconSrc,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-testid="daily-aim-modal-v3"
        className="relative w-[800px] h-[650px] min-w-[600px] min-h-[500px] rounded bg-white p-8 shadow-lg"
      >
        <button
          className="absolute top-6 right-6 text-2xl text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="mb-4 pr-8 text-xl font-semibold">Daily Aim</h2>
        <textarea
          id={`p1an-day-aim-${userId}`}
          className="mb-6 h-[350px] w-full border p-3"
          value={dailyAim}
          onChange={(e) => setDailyAim(e.target.value)}
          rows={8}
          maxLength={500}
          disabled={!editable}
        />
        <div className="mb-2">
          <span className="block text-sm font-medium">Daily ingredients</span>
          <div
            id={`p1an-day-igrd-${userId}`}
            className="mb-2 flex flex-wrap gap-2"
          >
            {dailyIngredientIds.length === 0 && (
              <span
                id={`p1an-day-igrd-none-${userId}`}
                className="text-sm text-gray-500"
              >
                No ingredient found
              </span>
            )}
            {dailyIngredientIds.map((iid) => {
              const ing = initialIngredients.find((i) => i.id === iid);
              const src = ing?.icon ? iconSrc(ing.icon) : null;
              return (
                <Link
                  key={iid}
                  id={`p1an-day-igrd-${iid}-${userId}`}
                  href={
                    viewId
                      ? `/view/${viewId}/ingredient/${ing?.id ?? ''}`
                      : `/ingredient/${ing?.id ?? ''}`
                  }
                  className="flex items-center gap-1 rounded border px-2 py-1"
                >
                  {src ? (
                    <img src={src} alt="" className="h-4 w-4" />
                  ) : (
                    <span>{ing?.icon}</span>
                  )}
                  <span className="text-sm">{ing?.title}</span>
                  {editable && (
                    <button
                      type="button"
                      className="ml-1 text-xs text-red-500"
                      onClick={(e) => {
                        e.preventDefault();
                        removeDailyIngredient(iid);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </Link>
              );
            })}
          </div>
          {editable && (
            <Link
              id={`p1an-day-add-${userId}`}
              href={`/ingredientsforplanning?date=${date}&block=day&mode=${mode}`}
              className="rounded border px-2 py-1 text-sm"
            >
              Add ingredients +
            </Link>
          )}
        </div>
        <div className="mt-2 text-right">
          <Button
            variant="outline"
            id={`p1an-day-done-${userId}`}
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

