'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useViewContext } from '@/lib/view-context';
import PlanningDateNav from './date-nav';
import type { Plan, PlanBlock, PlanBlockInput } from '@/types/plan';
import type { Ingredient } from '@/types/ingredient';
import type { Flavor } from '@/types/flavor';
import type { Subflavor } from '@/types/subflavor';
import type { ChatMessage, ChatThread } from '@/types/chat';
import { savePlanAction } from './actions';
import { cn } from '@/lib/utils';
import ColorPresetPicker from '@/components/color-preset-picker';
import {
  addUserColorPreset,
  getUserColorPresets,
  DEFAULT_COLOR_PRESETS,
  type ColorPreset,
} from '@/lib/color-presets';
import {
  addBlockPresetCategory,
  addUserBlockPreset,
  getUserBlockPresetCategories,
  getUserBlockPresets,
  type ActivityBlockPreset,
  type BlockPresetCategory,
  userBlockPresetCategoriesKey,
  userBlockPresetsKey,
} from '@/lib/block-presets';
import type {
  HeadingReport,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
} from '@/types/report';
import type { Todo } from '@/types/todo';
import { getCoachTone, getCoachTonePrompt } from '@/lib/ai/coach-tone';

const COLORS = [
  '#F87171',
  '#FBBF24',
  '#34D399',
  '#60A5FA',
  '#A78BFA',
  '#F472B6',
  '#FB923C',
  '#4ADE80',
  '#2DD4BF',
  '#94A3B8',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function iconSrc(ic: string) {
  if (ic.startsWith('data:')) return ic;
  if (/^[A-Za-z0-9+/=]+$/.test(ic)) return `data:image/png;base64,${ic}`;
  return null;
}

// shrink timeline so 24h fits on one screen
const BASE_PIXELS_PER_MINUTE = 0.5;
const TIMELINE_HEIGHT = 24 * 60 * BASE_PIXELS_PER_MINUTE; // full-day height
const MAX_MINUTES = 24 * 60; // minutes in a day
const DEFAULT_START = 5 * 60; // 05:00
const DEFAULT_END = 22 * 60; // 22:00
const Z_BASE = 10000;

function getTextColor(hex: string) {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return '#000000';
  }
  // Expand shorthand form (#abc) to full form (#aabbcc)
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128 ? '#FFFFFF' : '#000000';
}

interface Props {
  userId: string;
  date: string; // plan date YYYY-MM-DD
  today: string; // today's date YYYY-MM-DD
  tz: string;
  initialPlan: Plan | null;
  ingredients?: Ingredient[];
  flavors?: Flavor[];
  subflavors?: Subflavor[];
  todos?: Todo[];
  live?: boolean;
  review?: boolean;
  initialShowDailyAim?: boolean;
  reportContext?: {
    heading: HeadingReport | null;
    daily: Pick<DailyReport, 'date' | 'bad' | 'observations'>[];
    weekly: Pick<
      WeeklyReport,
      'startDate' | 'endDate' | 'bad' | 'observations'
    >[];
    monthly: Pick<
      MonthlyReport,
      'startDate' | 'endDate' | 'bad' | 'observations'
    >[];
  };
  planDates: string[];
}

export default function EditorClient({
  userId,
  date,
  today,
  tz,
  initialPlan,
  ingredients: initialIngredients = [],
  flavors: initialFlavors = [],
  subflavors: initialSubflavors = [],
  todos: initialTodos = [],
  live = false,
  review = false,
  initialShowDailyAim = false,
  reportContext,
  planDates,
}: Props) {
  const {
    editable,
    viewId,
    viewerId,
    mode: viewMode,
    snapshotDate,
    ownerId,
  } = useViewContext();
  // Viewer id is null when editing own plan; otherwise it represents the
  // currently logged-in user. Some browsers may provide `undefined` before the
  // context hydrates, so fall back to the owner id only when a viewer id is not
  // present. This ensures copied presets in viewer mode target the viewer's
  // library instead of the plan owner's.
  const currentUserId = viewerId != null ? String(viewerId) : userId;
  const mode = live ? 'live' : 'next';
  const reviewDayHasPassed = review && today > date;
  // Persist plans per-user and per-date. Live and review modes share the
  // same key while future planning uses its own so adjustments remain across
  // calendar days even if the network request fails.
  const storageKey = `${live || review ? 'live' : 'next'}-plan-${userId}-${date}`;
  const reviewKey = `review-${userId}-${date}`;
  const [blocks, setBlocks] = useState<PlanBlock[]>(() => {
    if (editable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw)
          return (JSON.parse(raw) as PlanBlock[]).map((b) => ({
            ...b,
            ingredientIds: b.ingredientIds ?? [],
            flavorIds: b.flavorIds ?? [],
            subflavorIds: b.subflavorIds ?? [],
            colorPreset: b.colorPreset ?? '',
          }));
      } catch {
        // ignore malformed data
      }
    }
    return (initialPlan?.blocks ?? []).map((b) => ({
      ...b,
      ingredientIds: b.ingredientIds ?? [],
      flavorIds: b.flavorIds ?? [],
      subflavorIds: b.subflavorIds ?? [],
      colorPreset: b.colorPreset ?? '',
    }));
  });
  const foreignPresets = useMemo(() => {
    if (initialPlan?.colorPresets && initialPlan.colorPresets.length > 0) {
      return initialPlan.colorPresets.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.colors[0],
      }));
    }
    const map = new Map<string, string>();
    for (const b of blocks) {
      if (b.colorPreset && b.color && !map.has(b.colorPreset)) {
        map.set(b.colorPreset, b.color);
      }
    }
    return Array.from(map.entries()).map(([name, color]) => ({
      name,
      color,
    }));
  }, [blocks, initialPlan?.colorPresets]);
  const [dailyAim, setDailyAim] = useState(() => initialPlan?.dailyAim ?? '');
  const [dailyIngredientIds, setDailyIngredientIds] = useState<number[]>(
    () => initialPlan?.dailyIngredientIds ?? [],
  );
  const [flavors] = useState(initialFlavors);
  const [subflavors] = useState(initialSubflavors);
  const [todos] = useState(initialTodos);
  const [selectFlavor, setSelectFlavor] = useState(false);
  const [flavorTab, setFlavorTab] = useState<'flavor' | 'subflavor'>('flavor');
  const [flavorSearch, setFlavorSearch] = useState('');
  const [tempFlavors, setTempFlavors] = useState<string[]>([]);
  const [tempSubs, setTempSubs] = useState<string[]>([]);
  const [showDailyAim, setShowDailyAim] = useState(initialShowDailyAim);
  const hasDailyAim = useMemo(
    () => dailyAim.trim().length > 0 || dailyIngredientIds.length > 0,
    [dailyAim, dailyIngredientIds],
  );
  const planningDateText = new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-US',
    {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );
  useEffect(() => {
    if (!initialShowDailyAim) return;
    setShowDailyAim(true);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          dailyAim?: string;
          dailyIngredientIds?: number[];
        };
        if (typeof parsed.dailyAim === 'string') setDailyAim(parsed.dailyAim);
        if (Array.isArray(parsed.dailyIngredientIds))
          setDailyIngredientIds(parsed.dailyIngredientIds);
      }
    } catch {
      // ignore
    }
  }, [initialShowDailyAim, storageKey]);

  const [aiOpen, setAiOpen] = useState(false);
  const welcome: ChatMessage = {
    role: 'assistant',
    content: live
      ? 'How can I help you make the most of your day?'
      : 'How can I help you with your planning?',
    createdAt: new Date().toISOString(),
  };
  const savedThread: ChatThread = useMemo(() => {
    const thread = live ? initialPlan?.liveChat : initialPlan?.planningChat;
    return {
      chatId: thread?.chatId || '',
      messages: Array.isArray(thread?.messages) ? thread!.messages : [],
    };
  }, [initialPlan, live]);
  let initialMsgs = savedThread.messages.length
    ? savedThread.messages
    : [welcome];
  if (snapshotDate) {
    const snap = new Date(snapshotDate);
    snap.setDate(snap.getDate() + 1);
    initialMsgs = initialMsgs.filter((m) => new Date(m.createdAt) < snap);
    if (initialMsgs.length === 0) initialMsgs = [welcome];
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMsgs);
  const [chatInput, setChatInput] = useState('');
  const chatIdRef = useRef<string>(
    savedThread.chatId ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)),
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiOpen]);
  useEffect(() => {
    if (!editable || snapshotDate) return;
    fetch('/api/planning/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        mode,
        chatId: chatIdRef.current,
        messages: chatMessages,
      }),
    }).catch(() => {});
  }, [chatMessages, editable, snapshotDate, date, mode]);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (aiOpen) document.body.classList.add('overflow-hidden');
    else document.body.classList.remove('overflow-hidden');
  }, [aiOpen]);
  const [reviews, setReviews] = useState<
    Record<
      string,
      { good: string; bad: string; ingredients: Record<number, string> }
    >
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(reviewKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<
            string,
            { good: string; bad: string; ingredients?: Record<number, string> }
          >;
          for (const k of Object.keys(parsed)) {
            parsed[k].ingredients = parsed[k].ingredients ?? {};
          }
          return parsed as Record<
            string,
            { good: string; bad: string; ingredients: Record<number, string> }
          >;
        }
      } catch {
        // ignore malformed data
      }
    }
    return {};
  });
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [blockPresets, setBlockPresets] = useState<ActivityBlockPreset[]>([]);
  const [presetCategories, setPresetCategories] = useState<BlockPresetCategory[]>([]);
  const [showPresetLibrary, setShowPresetLibrary] = useState(false);
  const [activePresetCategory, setActivePresetCategory] = useState<
    'all' | 'uncategorized' | string
  >('all');
  const [showBlockPresetMenu, setShowBlockPresetMenu] = useState(false);
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [savePresetName, setSavePresetName] = useState('');
  const [savePresetCategories, setSavePresetCategories] = useState<string[]>([]);
  const [newPresetCategoryName, setNewPresetCategoryName] = useState('');
  const [libraryCategoryName, setLibraryCategoryName] = useState('');
  const [showLoadPlanning, setShowLoadPlanning] = useState(false);
  const [loadSelectedDate, setLoadSelectedDate] = useState<string | null>(null);
  const [loadMonth, setLoadMonth] = useState(() => new Date(`${date}T00:00:00`));
  const [loadStep, setLoadStep] = useState<'calendar' | 'preview'>('calendar');
  const [loadPreviewPlan, setLoadPreviewPlan] = useState<Plan | null>(null);
  const [loadPreviewDate, setLoadPreviewDate] = useState<string | null>(null);
  const [loadPreviewLoading, setLoadPreviewLoading] = useState(false);
  const [loadFetching, setLoadFetching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadApplying, setLoadApplying] = useState(false);
  const [loadSuccessMessage, setLoadSuccessMessage] = useState<string | null>(null);
  const planCacheRef = useRef(new Map<string, Plan>());
  const previewRequestRef = useRef(0);
  const availablePlanDates = useMemo(() => new Set(planDates), [planDates]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metaPinned, setMetaPinned] = useState(false);
  const blockMenuRef = useRef<HTMLDivElement | null>(null);
  const openMeta = useCallback((id: string) => {
    setSelectedId(id);
    setMetaPinned(true);
  }, []);
  const closeMeta = useCallback(() => {
    setSelectedId(null);
    setMetaPinned(false);
  }, []);
  const selected = useMemo(
    () => blocks.find((b) => b.id === selectedId) || null,
    [blocks, selectedId],
  );
  const [selectIngredient, setSelectIngredient] = useState(false);
  useEffect(() => {
    setSelectIngredient(false);
  }, [selectedId]);
  useEffect(() => {
    setSelectFlavor(false);
  }, [selectedId]);
  useEffect(() => {
    if (!loadSuccessMessage) return;
    const timer = setTimeout(() => setLoadSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [loadSuccessMessage]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setBlockPresets(getUserBlockPresets(currentUserId));
    setPresetCategories(getUserBlockPresetCategories(currentUserId));
  }, [currentUserId]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handleStorage(e: StorageEvent) {
      if (e.key === userBlockPresetsKey(currentUserId)) {
        setBlockPresets(getUserBlockPresets(currentUserId));
      } else if (e.key === userBlockPresetCategoriesKey(currentUserId)) {
        setPresetCategories(getUserBlockPresetCategories(currentUserId));
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentUserId]);
  useEffect(() => {
    if (!showBlockPresetMenu) return;
    function handleClick(e: MouseEvent) {
      if (!blockMenuRef.current) return;
      if (!blockMenuRef.current.contains(e.target as Node)) {
        setShowBlockPresetMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showBlockPresetMenu]);
  useEffect(() => {
    setShowBlockPresetMenu(false);
    setShowSavePresetDialog(false);
  }, [selectedId]);
  const unreviewedIngredientIds = useMemo(() => {
    if (!selected) return [] as number[];
    const reviewed = reviews[selected.id]?.ingredients || {};
    return (selected.ingredientIds ?? []).filter((iid) => !(iid in reviewed));
  }, [selected, reviews]);
  const [selectDailyIngredient, setSelectDailyIngredient] = useState(false);
  useEffect(() => {
    if (!showDailyAim) {
      setSelectDailyIngredient(false);
      if (typeof document !== 'undefined') document.body.style.overflow = '';
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDailyAim]);
  const unreviewedDailyIngredientIds = useMemo(() => {
    const reviewed = reviews['day']?.ingredients || {};
    return dailyIngredientIds.filter((iid) => !(iid in reviewed));
  }, [dailyIngredientIds, reviews]);
  const categoryMap = useMemo(
    () => new Map(presetCategories.map((c) => [c.id, c])),
    [presetCategories],
  );
  const sortedCategories = useMemo(
    () =>
      [...presetCategories].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [presetCategories],
  );
  const loadMonthLabel = useMemo(
    () =>
      loadMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [loadMonth],
  );
  const loadCalendarDays = useMemo(() => {
    const monthStart = new Date(
      loadMonth.getFullYear(),
      loadMonth.getMonth(),
      1,
    );
    const monthEnd = new Date(
      loadMonth.getFullYear(),
      loadMonth.getMonth() + 1,
      0,
    );
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
    const days: Date[] = [];
    for (let cur = new Date(gridStart); cur <= gridEnd; cur.setDate(cur.getDate() + 1)) {
      days.push(new Date(cur));
    }
    return days;
  }, [loadMonth]);
  const sortedBlockPresets = useMemo(
    () =>
      [...blockPresets].sort((a, b) => {
        const aTime = Date.parse(a.updatedAt) || Date.parse(a.createdAt);
        const bTime = Date.parse(b.updatedAt) || Date.parse(b.createdAt);
        return bTime - aTime;
      }),
    [blockPresets],
  );
  const filteredBlockPresets = useMemo(() => {
    if (activePresetCategory === 'all') return sortedBlockPresets;
    if (activePresetCategory === 'uncategorized') {
      return sortedBlockPresets.filter((p) => !(p.categoryIds?.length));
    }
    return sortedBlockPresets.filter((p) =>
      (p.categoryIds ?? []).includes(activePresetCategory),
    );
  }, [sortedBlockPresets, activePresetCategory]);
  const canUsePresetLibrary = editable && !review;
  const canSaveBlockPreset = editable && !!selected;
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const openLibrary = showPresetLibrary && canUsePresetLibrary;
    const openSave = showSavePresetDialog;
    if (!openLibrary && !openSave) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPresetLibrary, showSavePresetDialog, canUsePresetLibrary]);
  useEffect(() => {
    const handler = () => closeMeta();
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', handler);
      window.addEventListener('beforeunload', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', handler);
        window.removeEventListener('beforeunload', handler);
      }
    };
  }, [closeMeta]);
  const draggingRef = useRef(false);
  const [startMinute, setStartMinute] = useState(DEFAULT_START);
  const [endMinute, setEndMinute] = useState(DEFAULT_END);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(minutesToTime(DEFAULT_START));
  const [customEnd, setCustomEnd] = useState(minutesToTime(DEFAULT_END));
  const visibleMinutes = endMinute - startMinute;
  const PIXELS_PER_MINUTE = TIMELINE_HEIGHT / visibleMinutes;
  const startHour = Math.floor(startMinute / 60);
  const endHour = Math.ceil(endMinute / 60);

  const headingToneId = reportContext?.heading?.coachTone ?? 'tone_medium';
  const rawHeadingToneCustom =
    reportContext?.heading?.coachToneCustom?.trim() ?? '';
  const headingToneCustom =
    headingToneId === 'tone_custom' ? rawHeadingToneCustom : '';
  const headingToneName = useMemo(
    () => getCoachTone(headingToneId).name,
    [headingToneId],
  );
  const toneDescription = useMemo(
    () => getCoachTonePrompt(headingToneId, headingToneCustom),
    [headingToneId, headingToneCustom],
  );

  const [nowMinute, setNowMinute] = useState(() => {
    if (!live) return 0;
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const d = new Date();
      setNowMinute(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [live]);

  useEffect(() => {
    if (!live) return;
    if (nowMinute < startMinute) setStartMinute(0);
    if (nowMinute > endMinute) setEndMinute(MAX_MINUTES);
  }, [live, nowMinute, startMinute, endMinute]);

  // Refresh when the calendar day changes in the user's timezone so the
  // planner always targets the correct date (live vs. next day).
  useEffect(() => {
    const check = () => {
      fetch(`/api/clock?tz=${encodeURIComponent(tz)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ymd !== today) {
            window.location.reload();
          }
        })
        .catch(() => {});
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [tz, today]);

  useEffect(() => {
    try {
      window.localStorage.setItem(reviewKey, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews, reviewKey]);

  useEffect(() => {
    if (!review) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setBlocks(JSON.parse(e.newValue) as PlanBlock[]);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [review, storageKey]);

  const minutesFromIso = useCallback(
    (iso: string) => {
      const base = new Date(`${date}T00:00:00`);
      const diff = Math.round(
        (new Date(iso).getTime() - base.getTime()) / 60000,
      );
      return Math.max(0, Math.min(diff, MAX_MINUTES));
    },
    [date],
  );
  const formatTime = useCallback(
    (iso: string) => {
      const diff = minutesFromIso(iso);
      const h = String(Math.floor(diff / 60)).padStart(2, '0');
      const m = String(diff % 60).padStart(2, '0');
      return `${h}:${m}`;
    },
    [minutesFromIso],
  );
  function minutesToTime(min: number) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
  }
  function formatDurationLabel(min: number) {
    const safe = Math.max(0, Math.floor(min));
    const hours = Math.floor(safe / 60);
    const minutes = safe % 60;
    const parts: string[] = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (!parts.length) return '0m';
    return parts.join(' ');
  }
  function isoFromMinutes(min: number) {
    const base = new Date(`${date}T00:00:00`);
    return new Date(base.getTime() + min * 60000).toISOString();
  }

  function minutesFromTime(t: string) {
    const match = t.match(/^(\d{1,2})(?::(\d{2}))$/);
    if (!match) return Number.NaN;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NaN;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return Number.NaN;
    }
    return hours * 60 + minutes;
  }

  function buildPlanBlocksContext(list: PlanBlock[]) {
    return list
      .map((b) => {
        const start = minutesFromIso(b.start);
        const end = minutesFromIso(b.end);
        const ing = b.ingredientIds
          .map((id) => initialIngredients.find((i) => i.id === id)?.title)
          .filter(Boolean)
          .join(', ');
        const flav = b.flavorIds
          .map((id) => initialFlavors.find((f) => f.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        const parts = [
          `Activity: ${b.title}`,
          `Description: ${b.description}`,
          `Time: ${minutesToTime(start)}-${minutesToTime(end)}`,
        ];
        if (ing) parts.push(`Ingredients: ${ing}`);
        if (flav) parts.push(`Flavors: ${flav}`);
        return parts.join('\n');
      })
      .join('\n\n');
  }

  function buildTodoContext(list: Todo[]) {
    const active = list.filter((t) => !t.completed);
    if (!active.length) return 'No to-dos.';
    const now = Date.now();
    return active
      .slice(0, 10)
      .map((t) => {
        let due = '';
        if (t.dueAt) {
          const exact = new Date(t.dueAt).toLocaleString('en-US', {
            timeZone: tz,
          });
          const rel = formatTimeUntil(t.dueAt, now);
          due = `, due ${exact} (${rel})`;
        }
        return `${t.title}${t.description ? ` - ${t.description}` : ''} (priority: ${t.priority}${due})`;
      })
      .join('; ');
  }

  function formatTimeUntil(dueAt: string, now: number) {
    const diff = new Date(dueAt).getTime() - now;
    const abs = Math.abs(diff);
    const mins = Math.round(abs / 60000);
    if (mins < 60) {
      return diff >= 0
        ? `due in ${mins} minute${mins === 1 ? '' : 's'}`
        : `overdue by ${mins} minute${mins === 1 ? '' : 's'}`;
    }
    const hours = Math.round(mins / 60);
    if (hours < 24) {
      return diff >= 0
        ? `due in ${hours} hour${hours === 1 ? '' : 's'}`
        : `overdue by ${hours} hour${hours === 1 ? '' : 's'}`;
    }
    const days = Math.round(hours / 24);
    return diff >= 0
      ? `due in ${days} day${days === 1 ? '' : 's'}`
      : `overdue by ${days} day${days === 1 ? '' : 's'}`;
  }

  function buildDailyAimContext() {
    const parts: string[] = [];
    if (dailyAim) parts.push(`Aim: ${dailyAim}`);
    if (dailyIngredientIds.length) {
      const names = dailyIngredientIds
        .map((id) => initialIngredients.find((i) => i.id === id)?.title)
        .filter(Boolean);
      if (names.length) parts.push(`Ingredients: ${names.join(', ')}`);
    }
    return parts.join('\n');
  }

  function buildReportContext(rc?: Props['reportContext']) {
    if (!rc) return '';
    const lines: string[] = [];
    if (rc.heading) {
      lines.push(`Overview: ${rc.heading.overview}`);
      if (rc.heading.shortTerm?.length)
        lines.push(
          `Heading towards short term: ${rc.heading.shortTerm.join('; ')}`,
        );
      if (rc.heading.longTerm?.length)
        lines.push(
          `Heading towards long term: ${rc.heading.longTerm.join('; ')}`,
        );
      if (rc.heading.feedback?.length)
        lines.push(`Feedback: ${rc.heading.feedback.join('; ')}`);
    }
    if (rc.daily?.length) {
      lines.push(
        'Daily rapports last 7 days: ' +
          rc.daily
            .slice(0, 7)
            .map(
              (d) =>
                `${d.date}: bad: ${d.bad.join('; ')} observations: ${d.observations.join(
                  '; ',
                )}`,
            )
            .join(' | '),
      );
    }
    if (rc.weekly?.length) {
      lines.push(
        'Weekly rapports last 2 weeks: ' +
          rc.weekly
            .slice(0, 2)
            .map(
              (w) =>
                `${w.startDate}-${w.endDate}: bad: ${w.bad.join('; ')} observations: ${w.observations.join(
                  '; ',
                )}`,
            )
            .join(' | '),
      );
    }
    if (rc.monthly?.length) {
      lines.push(
        'Monthly rapports last 2 months: ' +
          rc.monthly
            .slice(0, 2)
            .map(
              (m) =>
                `${m.startDate}-${m.endDate}: bad: ${m.bad.join('; ')} observations: ${m.observations.join(
                  '; ',
                )}`,
            )
            .join(' | '),
      );
    }
    return lines.join('\n');
  }

  function summarizeBlock(b: PlanBlock) {
    const start = minutesFromIso(b.start);
    const end = minutesFromIso(b.end);
    const ing = b.ingredientIds
      .map((id) => initialIngredients.find((i) => i.id === id)?.title)
      .filter(Boolean)
      .join(', ');
    const flav = b.flavorIds
      .map((id) => initialFlavors.find((f) => f.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    const parts = [
      `Activity: ${b.title}`,
      `Description: ${b.description}`,
      `Time: ${minutesToTime(start)}-${minutesToTime(end)}`,
    ];
    if (ing) parts.push(`Ingredients: ${ing}`);
    if (flav) parts.push(`Flavors: ${flav}`);
    return parts.join(' ');
  }

  function buildLiveContext(prompt: string) {
    const rational =
      typeof window !== 'undefined'
        ? localStorage.getItem('review-rational') || ''
        : '';
    const guilty =
      typeof window !== 'undefined'
        ? localStorage.getItem('review-guilty') || ''
        : '';
    const report = buildReportContext(reportContext);
    const aim = buildDailyAimContext();
    const nowStr = new Date().toLocaleString('en-US', { timeZone: tz });
    const now = nowMinute;
    const current = blocks.filter((b) => {
      const s = minutesFromIso(b.start);
      const e = minutesFromIso(b.end);
      return s <= now && now < e;
    });
    const done = blocks.filter((b) => minutesFromIso(b.end) <= now);
    const upcoming = blocks.filter((b) => minutesFromIso(b.start) > now);
    const curStr = current.length
      ? current.map(summarizeBlock).join(' | ')
      : 'none';
    const doneStr = done.length ? done.map(summarizeBlock).join(' | ') : 'none';
    const upStr = upcoming.length
      ? upcoming.map(summarizeBlock).join(' | ')
      : 'none';
    const ingredientStr = initialIngredients
      .slice()
      .sort((a, b) => b.usefulness - a.usefulness)
      .map((i) => `${i.title} (${i.usefulness})`)
      .join(', ');
    const flavorStr = initialFlavors
      .slice()
      .sort((a, b) => b.importance - a.importance)
      .map((f) => `${f.name} (${f.importance})`)
      .join(', ');
    const todoStr = buildTodoContext(todos);
    return (
      `The goal/life ethos of the user is ${rational}; the guilty pleasure is ${guilty}. ` +
      `according to the rapports this is the direction of the user ${report}. ` +
      `The daily aim of the user is: ${aim}. ` +
      `The current time is ${nowStr}, currently the user is doing this activity ${curStr}. ` +
      `The activities the user already done today ${doneStr} , and these activities the user still has to do ${upStr}. ` +
      `These are the user's to-dos: ${todoStr}. ` +
      `The ingredients the user has created ${ingredientStr}. ` +
      `And the main flavours of the user ${flavorStr}. ` +
      `Youre goal is to help the user with: ${prompt}`
    );
  }

  function buildPlanningContext() {
    const rational =
      typeof window !== 'undefined'
        ? localStorage.getItem('review-rational') || ''
        : '';
    const report = buildReportContext(reportContext);
    const aim = buildDailyAimContext();
    const planBlocks = buildPlanBlocksContext(blocks);
    const todoStr = buildTodoContext(todos);
    return (
      `Planning for ${planningDateText}. ` +
      `this is the life ethos statement/goal the user has in its life: ${rational}. ` +
      `This is the rapport of the user where he is heading towards, which include an Overview. heading toward long and short term, and feedback: ${report}. ` +
      `----- here is the current users aim for the day: ${aim}. ` +
      `Currently the user has the following planning: ${planBlocks}. ` +
      `These are the user's to-dos: ${todoStr}. ` +
      `That was the context. now this is the input message the user had (very important to respond to that):`
    );
  }

  type ActivitySuggestion = {
    Activity: string;
    Description: string;
    start: string;
    end: string;
  };

  type ActivitySuggestionResult = {
    activities: ActivitySuggestion[];
    invalidCount: number;
  };

  function extractJsonSegments(str: string) {
    const segments: string[] = [];
    let startIndex = -1;
    const stack: string[] = [];
    let inString = false;
    let escape = false;

    for (let i = 0; i < str.length; i += 1) {
      const ch = str[i];

      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === '\\') {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '{' || ch === '[') {
        if (stack.length === 0) {
          startIndex = i;
        }
        stack.push(ch);
      } else if (ch === '}' || ch === ']') {
        const expected = ch === '}' ? '{' : '[';
        if (stack.length === 0 || stack[stack.length - 1] !== expected) {
          stack.length = 0;
          startIndex = -1;
          continue;
        }
        stack.pop();
        if (stack.length === 0 && startIndex >= 0) {
          segments.push(str.slice(startIndex, i + 1));
          startIndex = -1;
        }
      }
    }

    return segments;
  }

  function normalizeTime(value: unknown): string | null {
    if (!value && value !== 0) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    const ampmMatch = raw.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i,
    );
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2] ?? '0', 10);
      const suffix = ampmMatch[3].toLowerCase();
      if (hours === 12) {
        hours = suffix === 'am' ? 0 : 12;
      } else if (suffix === 'pm') {
        hours += 12;
      }
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const hmMatch = raw.match(/^(\d{1,2})(?::(\d{2}))$/);
    if (hmMatch) {
      const hours = parseInt(hmMatch[1], 10);
      const minutes = parseInt(hmMatch[2], 10);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const hourOnlyMatch = raw.match(/^(\d{1,2})h(?:ours?)?$/i);
    if (hourOnlyMatch) {
      const hours = parseInt(hourOnlyMatch[1], 10);
      if (Number.isNaN(hours) || hours < 0 || hours > 23) return null;
      return `${String(hours).padStart(2, '0')}:00`;
    }

    const compactMatch = raw.match(/^(\d{1,2})(\d{2})$/);
    if (compactMatch) {
      const hours = parseInt(compactMatch[1], 10);
      const minutes = parseInt(compactMatch[2], 10);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    return null;
  }

  function parseDurationMinutes(value: unknown): number | null {
    if (!value && value !== 0) return null;
    const raw = String(value).trim().toLowerCase();
    if (!raw) return null;

    const hourMatch = raw.match(/(\d+(?:\.\d+)?)\s*h/);
    const minuteMatch = raw.match(/(\d+(?:\.\d+)?)\s*m/);

    let total = 0;
    if (hourMatch) {
      total += parseFloat(hourMatch[1]) * 60;
    }
    if (minuteMatch) {
      total += parseFloat(minuteMatch[1]);
    }

    if (!hourMatch && !minuteMatch) {
      const numeric = parseFloat(raw);
      if (!Number.isNaN(numeric)) {
        if (raw.includes('hour')) {
          total += numeric * 60;
        } else {
          total += numeric;
        }
      }
    }

    if (!Number.isFinite(total) || total <= 0) return null;
    return Math.round(total);
  }

  function sanitizeActivitySuggestion(raw: any): ActivitySuggestion | null {
    if (!raw || typeof raw !== 'object') return null;
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(raw)) {
      normalized[key.toLowerCase()] = value;
    }

    const activity =
      raw.Activity ??
      normalized.activity ??
      normalized.title ??
      normalized.name;
    const description =
      raw.Description ??
      normalized.description ??
      normalized.details ??
      '';
    let start =
      normalizeTime(raw.start) ??
      normalizeTime(normalized.start) ??
      normalizeTime(normalized.begin) ??
      normalizeTime(normalized.starttime);
    let end =
      normalizeTime(raw.end) ??
      normalizeTime(normalized.end) ??
      normalizeTime(normalized.finish) ??
      normalizeTime(normalized.endtime);

    if (!start) return null;

    if (!end) {
      const duration =
        parseDurationMinutes(normalized.duration) ??
        parseDurationMinutes(normalized.length);
      if (duration) {
        const [h, m] = start.split(':').map((v) => parseInt(v, 10));
        const minutes = h * 60 + m + duration;
        if (minutes < 0 || minutes >= 24 * 60) return null;
        const endHours = Math.floor(minutes / 60);
        const endMinutes = minutes % 60;
        end = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      }
    }

    if (!activity || !start || !end) return null;

    const startMin = minutesFromTime(start);
    const endMin = minutesFromTime(end);
    if (Number.isNaN(startMin) || Number.isNaN(endMin) || endMin <= startMin) {
      return null;
    }

    return {
      Activity: String(activity).trim(),
      Description: String(description ?? '').trim(),
      start,
      end,
    };
  }

  function toActivitySuggestions(value: any): ActivitySuggestionResult | null {
    const list = Array.isArray(value) ? value : [value];
    const activities: ActivitySuggestion[] = [];
    let invalidCount = 0;

    for (const entry of list) {
      const sanitized = sanitizeActivitySuggestion(entry);
      if (sanitized) activities.push(sanitized);
      else invalidCount += 1;
    }

    if (!activities.length) return invalidCount ? { activities, invalidCount } : null;
    return { activities, invalidCount };
  }

  function parseActivities(str: string): ActivitySuggestionResult | null {
    const tryParse = (value: string) => {
      try {
        const parsed = JSON.parse(value);
        return toActivitySuggestions(parsed);
      } catch {
        return null;
      }
    };

    const direct = tryParse(str);
    if (direct) return direct;

    const blockMatch = str.match(/```json\s*([\s\S]*?)\s*```/i);
    if (blockMatch) {
      const parsed = tryParse(blockMatch[1]);
      if (parsed) return parsed;
    }

    for (const segment of extractJsonSegments(str)) {
      const parsed = tryParse(segment);
      if (parsed) return parsed;
    }

    return null;
  }

  type ColorAssignment = {
    Activity: string;
    ColorPresetId: string;
  };

  function parseColorAssignments(str: string): ColorAssignment[] | null {
    try {
      const obj = JSON.parse(str);
      return Array.isArray(obj) ? obj : [obj];
    } catch {
      try {
        const m = str.match(/```json\s*([\s\S]*?)\s*```/i);
        if (m) {
          const obj = JSON.parse(m[1]);
          return Array.isArray(obj) ? obj : [obj];
        }
      } catch {
        return null;
      }
      return null;
    }
  }

  function resetChat() {
    if (!editable) return;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    chatIdRef.current = id;
    setChatMessages([welcome]);
  }

  const PLANNING_SYSTEM_PROMPT = `You are a helpful assistant planning agent in the Cake framework, a life-planning platform where users build a cake which represent their ethos statement using flavours which are built with ingredients—Flavours are kind of the goals/vectorial placement people have in different domains in life, these flavours combined (and of course their execution) leads to a cake. You are helping the user plan the day for ${planningDateText}. Your goal is to advise the user based on the context of his current daily activities, his goals in life, where he is heading towards in life, last 7 day rapport, last 2 week rapport, and last 2 months rapport of his performance. Based on all that context you are going to recommend an activity to the user. The input message the user sended is always the most important: so if the user wants to plan a specific activity you will help him find the best time in the planning and help him with descriptions. If the user asks to plan your day for him, you are going to advise more than 1 activity. If the user asks you to plan activities without clarifying which ones, create a planning that takes both what you know about the user's progress and his to-dos, aiming for an ideal schedule that fits the user's needs. Always listen to the feedback of the user, and try to make as good as possible planning for him or her. Regarding to-dos, always advise planning each task before its deadline. In the first message always propose the activities you recommend to the user. So always base your answer on the context and the user request. Also match your ambitions in the planning of the users ambitions and capabilities. Always end the first message with : Do you want me to plan an activity or more for you? . when the user wants you to plan an activity then respond ONLY with a JSON array (and nothing else) where each item contains the fields: Activity (title of the activity), Description (detailed description of the activity), start (start time in 24-hour HH:MM format), and end (end time in 24-hour HH:MM format) for each activity the user wanted to have implemented. Never include commentary outside of the JSON when returning those activities.`;
  const LIVE_SYSTEM_PROMPT =
    'You are a helpful live assistant agent in the Cake framework, a life-planning platform where users build a cake which represent their ethos statement using flavours which are built with ingredients—Flavours are kind of the goals/vectorial placement people have in different domains in life, these flavours combined (and of course their execution) leads to a cake, ingredients are kind of the habits the user has created to help him create the flavours successful. Your context as an agent: the person is currently working on his planning on the day, and when he chats with you Your goal is to provide help with whatever the user needs help with. probably it is going to be with finding motivation , or questions on if he or she should build the day up differently from now, or just general tips. Your context will exist out of his goal in life, where he is currently heading towards according to the rapport , the current activities he is doing. the other activities on the day. the daily aim. and all the ingredients and flavours the user has on his account. You are going to make him motivated, with reminding him about the goal etc. talk him out of negative thoughts, and help him make the best out of the day. Give him a sense of purpose, recognition of his work, and belief. Yet stay honest. Really motivates him or her to perform outstandingly. the tone and honesty the user wants: ${toneDescription} ';
  const SYSTEM_PROMPT = live ? LIVE_SYSTEM_PROMPT : PLANNING_SYSTEM_PROMPT;

  async function sendChat() {
    if (!editable || !chatInput.trim()) return;
    const isFirst =
      chatMessages.length === 1 && chatMessages[0].role === 'assistant';
    const userContent = isFirst
      ? live
        ? buildLiveContext(chatInput)
        : `${chatInput}\n\n${buildPlanningContext()}`
      : chatInput;
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      {
        role: 'user',
        content: userContent,
        createdAt: new Date().toISOString(),
      },
    ];
    setChatMessages(newMessages);
    setChatInput('');
    const payload = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...newMessages.map(({ role, content }) => ({ role, content })),
    ];
    try {
      const res = await fetch('/api/planning/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatIdRef.current, messages: payload }),
      });
      const data = await res.json();
      if (data.response) {
        if (live) {
          setChatMessages([
            ...newMessages,
            {
              role: 'assistant',
              content: data.response as string,
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          const parsed = parseActivities(data.response as string);
          if (parsed && parsed.activities.length) {
            const presets = [
              ...DEFAULT_COLOR_PRESETS,
              ...getUserColorPresets(userId),
            ];
            const presetMap = new Map(presets.map((p) => [p.id, p]));
            let assignments: ColorAssignment[] | null = null;
            try {
              const colorRes = await fetch('/api/planning/color-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  activities: parsed.activities,
                  presets: presets.map((p) => ({ id: p.id, name: p.name })),
                }),
              });
              const colorData = await colorRes.json();
              assignments = parseColorAssignments(colorData.response as string);
            } catch {
              assignments = null;
            }

            const titles = parsed.activities.map((p) => p.Activity).join(', ');
            const confirmMessage = parsed.invalidCount
              ? `Should I add these ${parsed.activities.length} activities (${titles})? ${parsed.invalidCount} suggestion(s) were skipped because they were incomplete.`
              : `Should I add these activities (${titles})?`;
            const ok = confirm(confirmMessage);
            if (ok) {
              const newBlocks = parsed.activities.map((p) => {
                const start = minutesFromTime(p.start);
                const end = minutesFromTime(p.end);
                const presetId = assignments?.find(
                  (a) => a.Activity === p.Activity,
                )?.ColorPresetId;
                const preset = presetId
                  ? (presetMap.get(presetId) as ColorPreset | undefined)
                  : undefined;
                return {
                  id:
                    typeof crypto !== 'undefined' && 'randomUUID' in crypto
                      ? crypto.randomUUID()
                      : Math.random().toString(36).slice(2),
                  planId: initialPlan?.id || '',
                  start: isoFromMinutes(start),
                  end: isoFromMinutes(end),
                  title: p.Activity,
                  description: p.Description,
                  color: preset ? preset.colors[0] : COLORS[0],
                  colorPreset: preset ? preset.id : '',
                  ingredientIds: [],
                  flavorIds: [],
                  subflavorIds: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as PlanBlock;
              });
              setBlocks((prev) => [...prev, ...newBlocks]);
              setChatMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content:
                    `Added activities: ${titles}.` +
                    (parsed.invalidCount
                      ? ` Skipped ${parsed.invalidCount} suggestion(s) that were missing valid times.`
                      : ''),
                  createdAt: new Date().toISOString(),
                },
              ]);
            } else {
              setChatMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content: 'Okay, not adding them.',
                  createdAt: new Date().toISOString(),
                },
              ]);
            }
          } else if (parsed && parsed.invalidCount) {
            setChatMessages([
              ...newMessages,
              {
                role: 'assistant',
                content:
                  'I could not add a plan because the suggested activities were missing valid times. Please try again with clear start and end times (HH:MM).',
                createdAt: new Date().toISOString(),
              },
            ]);
          } else {
            setChatMessages([
              ...newMessages,
              {
                role: 'assistant',
                content: data.response as string,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        }
      }
    } catch {
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong.',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  useEffect(() => {
    if (!review) return;
    setReviews((prev) => {
      const ids = new Set(blocks.map((b) => b.id));
      const next: Record<
        string,
        { good: string; bad: string; ingredients: Record<number, string> }
      > = {
        ...prev,
      };
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) delete next[id];
      }
      return next;
    });
  }, [blocks, review]);

  useEffect(() => {
    if (!review || reviewDayHasPassed) return;
    const now = nowMinute;
    setReviews((prev) => {
      const next: Record<
        string,
        { good: string; bad: string; ingredients: Record<number, string> }
      > = {
        ...prev,
      };
      for (const b of blocks) {
        if (minutesFromIso(b.end) > now && next[b.id]) {
          delete next[b.id];
        }
      }
      return next;
    });
  }, [nowMinute, blocks, review, minutesFromIso, reviewDayHasPassed]);

  function updateBlock(id: string, updates: Partial<PlanBlock>) {
    if (review) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  }

  function removeIngredient(blockId: string, ingredientId: number) {
    const blk = blocks.find((b) => b.id === blockId);
    if (!blk) return;
    updateBlock(blockId, {
      ingredientIds: blk.ingredientIds.filter((id) => id !== ingredientId),
    });
  }

  function removeFlavor(blockId: string, flavorId: string) {
    const blk = blocks.find((b) => b.id === blockId);
    if (!blk) return;
    updateBlock(blockId, {
      flavorIds: (blk.flavorIds || []).filter((id) => id !== flavorId),
    });
  }

  function removeSubflavor(blockId: string, subId: string) {
    const blk = blocks.find((b) => b.id === blockId);
    if (!blk) return;
    updateBlock(blockId, {
      subflavorIds: (blk.subflavorIds || []).filter((id) => id !== subId),
    });
  }

  function removeDailyIngredient(ingredientId: number) {
    setDailyIngredientIds((ids) => ids.filter((id) => id !== ingredientId));
  }

  function addIngredientReview(blockId: string, ingredientId: number) {
    setReviews((prev) => ({
      ...prev,
      [blockId]: {
        ...(prev[blockId] || { good: '', bad: '', ingredients: {} }),
        ingredients: {
          ...(prev[blockId]?.ingredients || {}),
          [ingredientId]: '',
        },
      },
    }));
  }

  function removeIngredientReview(blockId: string, ingredientId: number) {
    setReviews((prev) => {
      const copy = { ...prev };
      const entry = copy[blockId];
      if (entry) {
        const ing = { ...entry.ingredients };
        delete ing[ingredientId];
        copy[blockId] = { ...entry, ingredients: ing };
      }
      return copy;
    });
  }

  const findExactSlot = useCallback(
    (duration: number) => {
      const sorted = [...blocks].sort(
        (a, b) => minutesFromIso(a.start) - minutesFromIso(b.start),
      );
      const isFree = (s: number, e: number) =>
        !sorted.some(
          (b) =>
            Math.max(s, minutesFromIso(b.start)) <
            Math.min(e, minutesFromIso(b.end)),
        );
      for (let c = startMinute; c + duration <= endMinute; c += 15) {
        if (isFree(c, c + duration)) return c;
      }
      return null;
    },
    [blocks, minutesFromIso, startMinute, endMinute],
  );

  function addBlock() {
    if (!editable || review) return;
    let candidate: number | null = null;
    let duration = 60;

    candidate = findExactSlot(60);
    if (candidate === null) {
      const small = findExactSlot(30);
      if (small !== null) {
        duration = 30;
        candidate = small;
      }
    }

    if (candidate === null) {
      const maxStart = endMinute - duration;
      if (maxStart <= startMinute) {
        candidate = startMinute;
      } else {
        const steps = Math.floor((maxStart - startMinute) / 15);
        candidate = startMinute + Math.floor(Math.random() * (steps + 1)) * 15;
      }
    }

    if (candidate === null) {
      alert('No 1-hour slot available.');
      return;
    }

    const start = candidate;
    const id = crypto.randomUUID();
    const newBlock: PlanBlock = {
      id,
      planId: initialPlan?.id || '',
      start: isoFromMinutes(start),
      end: isoFromMinutes(start + duration),
      title: '',
      description: '',
      color: COLORS[0],
      colorPreset: '',
      ingredientIds: [],
      flavorIds: [],
      subflavorIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBlocks((b) => [...b, newBlock]);
    openMeta(id);
  }

  function ensurePresetCategory(name: string) {
    const added = addBlockPresetCategory(currentUserId, name);
    if (!added) return null;
    setPresetCategories((prev) => {
      if (prev.some((c) => c.id === added.id)) return prev;
      return [...prev, added];
    });
    return added;
  }

  function handleSaveBlockPreset() {
    if (!selected || !editable) return;
    const name = savePresetName.trim();
    if (!name) {
      alert('Please enter a name for this preset.');
      return;
    }
    const duration = Math.max(
      15,
      minutesFromIso(selected.end) - minutesFromIso(selected.start),
    );
    const uniqueCategories = Array.from(new Set(savePresetCategories));
    const saved = addUserBlockPreset(currentUserId, {
      title: name,
      description: selected.description ?? '',
      color: selected.color,
      colorPreset: selected.colorPreset ?? '',
      ingredientIds: selected.ingredientIds ?? [],
      flavorIds: selected.flavorIds ?? [],
      subflavorIds: selected.subflavorIds ?? [],
      duration,
      categoryIds: uniqueCategories,
    });
    setBlockPresets((prev) => {
      const next = prev.filter((p) => p.id !== saved.id);
      next.push(saved);
      return next;
    });
    setShowSavePresetDialog(false);
    setSavePresetCategories([]);
    setNewPresetCategoryName('');
    alert('Activity block saved to presets.');
  }

  function addBlockFromPreset(preset: ActivityBlockPreset) {
    if (!editable || review) return;
    const duration = Math.max(15, preset.duration || 60);
    let candidate = findExactSlot(duration);
    if (candidate === null) {
      const maxStart = endMinute - duration;
      if (maxStart <= startMinute) {
        candidate = startMinute;
      } else {
        const steps = Math.floor((maxStart - startMinute) / 15);
        candidate = startMinute + Math.floor(Math.random() * (steps + 1)) * 15;
      }
    }
    if (candidate === null) {
      alert('No space available for this preset. Adjust your timeline range.');
      return;
    }
    const start = candidate;
    const end = Math.min(start + duration, MAX_MINUTES);
    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const newBlock: PlanBlock = {
      id,
      planId: initialPlan?.id || '',
      start: isoFromMinutes(start),
      end: isoFromMinutes(end),
      title: preset.title,
      description: preset.description,
      color: preset.color,
      colorPreset: preset.colorPreset ?? '',
      ingredientIds: [...(preset.ingredientIds ?? [])],
      flavorIds: [...(preset.flavorIds ?? [])],
      subflavorIds: [...(preset.subflavorIds ?? [])],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setBlocks((prev) => [...prev, newBlock]);
    openMeta(id);
    setShowPresetLibrary(false);
  }

  function openSaveBlockPresetDialog() {
    if (!selected || !editable) return;
    setSavePresetName(selected.title || 'Untitled activity');
    setSavePresetCategories([]);
    setNewPresetCategoryName('');
    setShowSavePresetDialog(true);
    setShowBlockPresetMenu(false);
  }

  function toggleSavePresetCategory(id: string) {
    setSavePresetCategories((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  }

  function handleCreateDialogCategory() {
    const added = ensurePresetCategory(newPresetCategoryName);
    if (!added) return;
    setSavePresetCategories((prev) =>
      prev.includes(added.id) ? prev : [...prev, added.id],
    );
    setNewPresetCategoryName('');
  }

  function handleCreateLibraryCategory() {
    const added = ensurePresetCategory(libraryCategoryName);
    if (!added) return;
    setLibraryCategoryName('');
    setActivePresetCategory(added.id);
  }

  function formatLoadDateLabel(value: string) {
    try {
      const ref = new Date(`${value}T00:00:00`);
      return ref.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  }

  function normalizePlanSnapshot(plan: Plan): Plan {
    return {
      ...plan,
      blocks: (plan.blocks ?? []).map((b) => ({
        ...b,
        ingredientIds: b.ingredientIds ?? [],
        flavorIds: b.flavorIds ?? [],
        subflavorIds: b.subflavorIds ?? [],
        colorPreset: b.colorPreset ?? '',
      })),
      dailyAim: plan.dailyAim ?? '',
      dailyIngredientIds: plan.dailyIngredientIds ?? [],
      colorPresets: plan.colorPresets ?? [],
      planningChat: plan.planningChat ?? { chatId: '', messages: [] },
      liveChat: plan.liveChat ?? { chatId: '', messages: [] },
    };
  }

  async function fetchPlanSnapshot(dateStr: string): Promise<Plan> {
    const cached = planCacheRef.current.get(dateStr);
    if (cached) return cached;
    const response = await fetch(`/api/planning/load?date=${dateStr}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('Failed to load plan');
    }
    const raw = (await response.json()) as Plan;
    const normalized = normalizePlanSnapshot(raw);
    planCacheRef.current.set(dateStr, normalized);
    return normalized;
  }

  function openLoadPlanningModal() {
    if (!editable || review || snapshotDate) return;
    const baseDate = loadSelectedDate ?? planDates[0] ?? date;
    setLoadMonth(new Date(`${baseDate}T00:00:00`));
    setLoadStep('calendar');
    setLoadPreviewPlan(null);
    setLoadPreviewDate(null);
    setLoadPreviewLoading(false);
    setLoadSelectedDate(null);
    setLoadError(null);
    setLoadFetching(false);
    setShowLoadPlanning(true);
  }

  function closeLoadPlanningModal() {
    setShowLoadPlanning(false);
    setLoadStep('calendar');
    setLoadPreviewPlan(null);
    setLoadPreviewDate(null);
    setLoadSelectedDate(null);
    setLoadError(null);
    setLoadPreviewLoading(false);
    setLoadFetching(false);
  }

  function previewMinutes(dateStr: string, iso: string) {
    const base = new Date(`${dateStr}T00:00:00`);
    const diff = Math.round((new Date(iso).getTime() - base.getTime()) / 60000);
    return Math.max(0, Math.min(diff, MAX_MINUTES));
  }

  function formatPreviewRange(block: PlanBlock, dateStr: string) {
    const start = previewMinutes(dateStr, block.start);
    const end = previewMinutes(dateStr, block.end);
    const sh = String(Math.floor(start / 60)).padStart(2, '0');
    const sm = String(start % 60).padStart(2, '0');
    const eh = String(Math.floor(end / 60)).padStart(2, '0');
    const em = String(end % 60).padStart(2, '0');
    return `${sh}:${sm} – ${eh}:${em}`;
  }

  async function handlePreviewPlan(dateStr: string) {
    setLoadSelectedDate(dateStr);
    setLoadError(null);
    setLoadStep('preview');
    setLoadPreviewLoading(true);
    setLoadPreviewDate(dateStr);
    const requestId = ++previewRequestRef.current;
    try {
      const planSnapshot = await fetchPlanSnapshot(dateStr);
      if (previewRequestRef.current !== requestId) return;
      setLoadPreviewPlan(planSnapshot);
    } catch {
      if (previewRequestRef.current !== requestId) return;
      setLoadPreviewPlan(null);
      setLoadError('Unable to preview that day right now. Please try again.');
    } finally {
      if (previewRequestRef.current === requestId) {
        setLoadPreviewLoading(false);
      }
    }
  }

  async function handleSelectPlan(dateStr: string) {
    if (loadApplying) return;
    setLoadSelectedDate(dateStr);
    setLoadError(null);
    setLoadFetching(true);
    try {
      const planSnapshot = await fetchPlanSnapshot(dateStr);
      applyLoadedPlan(planSnapshot, dateStr);
    } catch {
      setLoadError('Unable to load that plan. Please try again.');
    } finally {
      setLoadFetching(false);
    }
  }

  function applyLoadedPlan(planSnapshot: Plan, sourceDate: string) {
    if (loadApplying) return;
    setLoadApplying(true);
    try {
      const normalized = normalizePlanSnapshot(planSnapshot);
      const payload = {
        blocks: normalized.blocks,
        dailyAim: normalized.dailyAim ?? '',
        dailyIngredientIds: normalized.dailyIngredientIds ?? [],
      };
      lastSaved.current = '__load-pending__';
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      setBlocks(normalized.blocks);
      setDailyAim(payload.dailyAim);
      setDailyIngredientIds(payload.dailyIngredientIds);
      closeMeta();
      setShowDailyAim(false);
      if (editable && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
          // ignore storage failures
        }
      }
      setShowLoadPlanning(false);
      setLoadStep('calendar');
      setLoadPreviewPlan(null);
      setLoadPreviewDate(null);
      setLoadSelectedDate(null);
      setLoadError(null);
      const label = formatLoadDateLabel(sourceDate);
      setLoadSuccessMessage(`Loaded plan from ${label}.`);
    } finally {
      setLoadApplying(false);
    }
  }

  function handleApplyPreview() {
    if (!loadPreviewPlan || !loadPreviewDate) return;
    setLoadError(null);
    applyLoadedPlan(loadPreviewPlan, loadPreviewDate);
  }

  const lastSaved = useRef(
    JSON.stringify({ blocks, dailyAim, dailyIngredientIds }),
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blocksRef = useRef(blocks);
  const dailyAimRef = useRef(dailyAim);
  const dailyIngredientIdsRef = useRef(dailyIngredientIds);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);
  useEffect(() => {
    dailyAimRef.current = dailyAim;
  }, [dailyAim]);
  useEffect(() => {
    dailyIngredientIdsRef.current = dailyIngredientIds;
  }, [dailyIngredientIds]);

  // When navigating between dates or users, refresh the block list so it
  // matches the server-provided plan (or cached local copy) without requiring
  // a full page reload.
  useEffect(() => {
    let fromStorage: {
      blocks?: PlanBlock[];
      dailyAim?: string;
      dailyIngredientIds?: number[];
    } | null = null;
    if (editable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          fromStorage = Array.isArray(parsed) ? { blocks: parsed } : parsed;
        }
      } catch {
        // ignore malformed data
      }
    }
    const nextBlocks = (fromStorage?.blocks ?? initialPlan?.blocks ?? []).map(
      (b) => ({
        ...b,
        ingredientIds: b.ingredientIds ?? [],
        colorPreset: b.colorPreset ?? '',
      }),
    );
    const nextAim = fromStorage?.dailyAim ?? initialPlan?.dailyAim ?? '';
    const nextIng =
      fromStorage?.dailyIngredientIds ?? initialPlan?.dailyIngredientIds ?? [];
    const serialized = JSON.stringify({
      blocks: nextBlocks,
      dailyAim: nextAim,
      dailyIngredientIds: nextIng,
    });
    if (serialized !== lastSaved.current) {
      setBlocks(nextBlocks);
      setDailyAim(nextAim);
      setDailyIngredientIds(nextIng);
      lastSaved.current = serialized;
    }
    if (editable && !fromStorage) {
      try {
        window.localStorage.setItem(storageKey, serialized);
      } catch {
        // ignore write errors
      }
    }
  }, [editable, storageKey, initialPlan, date]);

  useEffect(() => {
    if (!editable || review) return;
    const serialized = JSON.stringify({
      blocks,
      dailyAim,
      dailyIngredientIds,
    });
    if (serialized === lastSaved.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const reqSerialized = serialized;
      const payload: PlanBlockInput[] = blocks.map((b) => ({
        id: b.id,
        start: b.start,
        end: b.end,
        title: b.title,
        description: b.description,
        color: b.color,
        colorPreset: b.colorPreset,
        ingredientIds: b.ingredientIds,
        flavorIds: b.flavorIds,
        subflavorIds: b.subflavorIds,
      }));
      const presetsSnapshot = getUserColorPresets(userId);
      savePlanAction(
        date,
        payload,
        dailyAim,
        dailyIngredientIds,
        presetsSnapshot,
      ).then((plan) => {
        const currentSerialized = JSON.stringify({
          blocks: blocksRef.current,
          dailyAim: dailyAimRef.current,
          dailyIngredientIds: dailyIngredientIdsRef.current,
        });
        if (currentSerialized !== reqSerialized) return;
        const prevSelected =
          metaPinned && selectedId
            ? blocksRef.current.find((b) => b.id === selectedId)
            : null;
        setBlocks(plan.blocks);
        setDailyAim(plan.dailyAim);
        setDailyIngredientIds(plan.dailyIngredientIds);
        if (prevSelected) {
          const match =
            plan.blocks.find((b) => b.id === prevSelected.id) ??
            plan.blocks.find(
              (b) =>
                b.start === prevSelected.start && b.end === prevSelected.end,
            );
          if (match) setSelectedId(match.id);
          else closeMeta();
        }
        const ser = JSON.stringify({
          blocks: plan.blocks,
          dailyAim: plan.dailyAim,
          dailyIngredientIds: plan.dailyIngredientIds,
        });
        lastSaved.current = ser;
        try {
          window.localStorage.setItem(storageKey, ser);
        } catch {
          // ignore write errors
        }
      });
      saveTimer.current = null;
    }, 500);
  }, [
    blocks,
    dailyAim,
    dailyIngredientIds,
    date,
    editable,
    live,
    storageKey,
    review,
    userId,
    metaPinned,
    selectedId,
    closeMeta,
  ]);

  useEffect(() => {
    if (!editable || review) return;
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        const payload: PlanBlockInput[] = blocksRef.current.map((b) => ({
          id: b.id,
          start: b.start,
          end: b.end,
          title: b.title,
          description: b.description,
          color: b.color,
          colorPreset: b.colorPreset,
          ingredientIds: b.ingredientIds,
          flavorIds: b.flavorIds,
          subflavorIds: b.subflavorIds,
        }));
        const presetsSnapshot = getUserColorPresets(userId);
        void savePlanAction(
          date,
          payload,
          dailyAimRef.current,
          dailyIngredientIdsRef.current,
          presetsSnapshot,
        ).then((plan) => {
          const ser = JSON.stringify({
            blocks: plan.blocks,
            dailyAim: plan.dailyAim,
            dailyIngredientIds: plan.dailyIngredientIds,
          });
          lastSaved.current = ser;
          try {
            window.localStorage.setItem(storageKey, ser);
          } catch {
            // ignore write errors
          }
        });
      }
    };
  }, [date, editable, storageKey, review, userId]);

  function handleTimeChange(id: string, field: 'start' | 'end', value: string) {
    if (review) return;
    const [h, m] = value.split(':').map((n) => parseInt(n, 10));
    const minutes = h * 60 + m;
    if (field === 'start') {
      const dur =
        minutesFromIso(selected!.end) - minutesFromIso(selected!.start);
      const maxStart = Math.max(0, MAX_MINUTES - dur);
      const newStart = Math.min(Math.max(minutes, 0), maxStart);
      updateBlock(id, {
        start: isoFromMinutes(newStart),
        end: isoFromMinutes(newStart + dur),
      });
    } else {
      const newEnd = Math.min(
        Math.max(minutes, minutesFromIso(selected!.start) + 15),
        MAX_MINUTES,
      );
      updateBlock(id, { end: isoFromMinutes(newEnd) });
    }
  }

  function applyCustomRange() {
    const [sh, sm] = customStart.split(':').map((n) => parseInt(n, 10));
    const [eh, em] = customEnd.split(':').map((n) => parseInt(n, 10));
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (isNaN(start) || isNaN(end) || start >= end) {
      alert('Invalid time range');
      return;
    }
    setStartMinute(Math.max(0, Math.min(start, MAX_MINUTES)));
    setEndMinute(Math.max(0, Math.min(end, MAX_MINUTES)));
    setShowCustom(false);
  }

  function onDragStart(
    e: React.PointerEvent,
    b: PlanBlock,
    mode: 'move' | 'start' | 'end',
    dragRef: React.MutableRefObject<boolean>,
  ) {
    if (!editable || review) return;
    e.preventDefault();
    dragRef.current = false;
    const startY = e.clientY;
    const initStart = minutesFromIso(b.start);
    const initEnd = minutesFromIso(b.end);
    const bounds = document
      .getElementById(`p1an-timecol-${userId}`)
      ?.getBoundingClientRect() ?? { top: 0, bottom: 0 };
    const marginPx = 10; // drop a little early to avoid glitches at edges
    function onMove(ev: PointerEvent) {
      dragRef.current = true;
      if (
        ev.clientY < bounds.top + marginPx ||
        ev.clientY > bounds.bottom - marginPx
      ) {
        onUp();
        return;
      }
      const delta =
        Math.round((ev.clientY - startY) / PIXELS_PER_MINUTE / 15) * 15;
      const rawStart = initStart + delta;
      const rawEnd = initEnd + delta;
      if (mode === 'move') {
        let newStart = rawStart;
        newStart = Math.max(
          0,
          Math.min(newStart, MAX_MINUTES - (initEnd - initStart)),
        );
        updateBlock(b.id, {
          start: isoFromMinutes(newStart),
          end: isoFromMinutes(newStart + (initEnd - initStart)),
        });
      } else if (mode === 'start') {
        let newStart = rawStart;
        newStart = Math.max(0, Math.min(newStart, initEnd - 15));
        updateBlock(b.id, { start: isoFromMinutes(newStart) });
      } else {
        let newEnd = rawEnd;
        newEnd = Math.max(initStart + 15, Math.min(newEnd, MAX_MINUTES));
        updateBlock(b.id, { end: isoFromMinutes(newEnd) });
      }
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragRef.current = false;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  const sortedBlocks = useMemo(
    () =>
      [...blocks].sort(
        (a, b) => minutesFromIso(a.start) - minutesFromIso(b.start),
      ),
    [blocks, minutesFromIso],
  );

  const blockDepth = useMemo(() => {
    const depthMap: Record<string, number> = {};
    const starts = sortedBlocks.map((b) => minutesFromIso(b.start));
    const ends = sortedBlocks.map((b) => minutesFromIso(b.end));
    sortedBlocks.forEach((b, i) => {
      const bStart = starts[i];
      const bEnd = ends[i];
      let depth = 0;
      sortedBlocks.forEach((o, j) => {
        if (i === j) return;
        if (starts[j] <= bStart && ends[j] >= bEnd) depth++;
      });
      depthMap[b.id] = depth;
    });
    return depthMap;
  }, [sortedBlocks, minutesFromIso]);

  const liveBlocks = useMemo(() => {
    if (!live) return [] as PlanBlock[];
    return blocks.filter((b) => {
      const s = minutesFromIso(b.start);
      const e = minutesFromIso(b.end);
      return s <= nowMinute && nowMinute < e;
    });
  }, [blocks, minutesFromIso, nowMinute, live]);

  const currentBlock = useMemo(() => {
    if (!liveBlocks.length) return null;
    return liveBlocks.reduce(
      (latest, b) =>
        minutesFromIso(b.start) > minutesFromIso(latest.start) ? b : latest,
      liveBlocks[0],
    );
  }, [liveBlocks, minutesFromIso]);

  useEffect(() => {
    if (!live || metaPinned) return;
    if (currentBlock) setSelectedId(currentBlock.id);
    else setSelectedId(null);
  }, [live, currentBlock, metaPinned]);

  const lineColor = useMemo(() => {
    if (!live) return '#FF0000';
    const overRed = blocks.some((b) => {
      const s = minutesFromIso(b.start);
      const e = minutesFromIso(b.end);
      return s <= nowMinute && nowMinute < e && b.color === '#F87171';
    });
    return overRed ? '#0000FF' : '#FF0000';
  }, [blocks, minutesFromIso, nowMinute, live]);

  return (
    <>
      <div className={cn('flex h-full', aiOpen && 'blur-md')}>
        <div
          className={`relative overflow-y-hidden ${selected ? 'w-1/2' : 'w-full'}`}
          id={`p1an-timecol-${userId}`}
        >
          <div
            className="sticky top-0 z-10 flex flex-wrap items-end gap-2 bg-gray-100 p-2 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {reportContext?.heading ? (
              <div className="w-full rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-orange-600">
                    Coach tone: {headingToneName}
                  </span>
                  {reportContext.heading.version ? (
                    <span className="text-[11px] uppercase tracking-wide text-orange-500">
                      Overview v{reportContext.heading.version}
                    </span>
                  ) : null}
                </div>
                {headingToneCustom ? (
                  <p className="mt-2 whitespace-pre-wrap text-orange-700">
                    {headingToneCustom}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-orange-600/80">
                    Using preset tone guidance.
                  </p>
                )}
              </div>
            ) : null}
            {!review &&
              (editable ? (
                <button
                  id={`p1an-add-top-${userId}`}
                  onClick={() => addBlock()}
                  disabled={!editable}
                  className="rounded border px-2 py-1"
                >
                  + Add timeslot
                </button>
              ) : (
                <button
                  id={`p1an-add-top-${userId}`}
                  className="rounded border px-2 py-1"
                  disabled
                  title="Read-only in viewing mode"
                >
                  + Add timeslot
                </button>
              ))}
            {!review &&
              (editable ? (
                <button
                  id={`p1an-add-custom-${userId}`}
                  onClick={() => {
                    setActivePresetCategory('all');
                    setShowPresetLibrary(true);
                  }}
                  disabled={!canUsePresetLibrary}
                  className="rounded border px-2 py-1"
                >
                  Add custom timeslot
                </button>
              ) : (
                <button
                  id={`p1an-add-custom-${userId}`}
                  className="rounded border px-2 py-1"
                  disabled
                  title="Read-only in viewing mode"
                >
                  Add custom timeslot
                </button>
              ))}
            <button
              id={`p1an-range-btn-${userId}`}
              className="rounded border px-2 py-1"
              onClick={() => setShowCustom((s) => !s)}
            >
              Add custom time
            </button>
            {startMinute > 0 && (
              <button
                id={`p1an-load-early-${userId}`}
                className="rounded border px-2 py-1"
                onClick={() => setStartMinute(0)}
              >
                Load earlier
              </button>
            )}
            {endMinute < MAX_MINUTES && (
              <button
                id={`p1an-load-late-${userId}`}
                className="rounded border px-2 py-1"
                onClick={() => setEndMinute(MAX_MINUTES)}
              >
                Load later
              </button>
            )}
            {!review && !live && editable && !snapshotDate && (
              <button
                id={`p1an-load-copy-${userId}`}
                className="rounded border border-orange-300 bg-orange-50 px-3 py-1 font-medium text-orange-600 hover:bg-orange-100"
                onClick={openLoadPlanningModal}
              >
                Load planning
              </button>
            )}
            <button
              id={`p1an-${live ? 'live-ai' : 'ai'}-${userId}`}
              className="rounded bg-orange-500 px-3 py-1 text-white"
              onClick={() => setAiOpen(true)}
            >
              {live ? 'Live AI' : 'AI planning'}
            </button>
            <Button
              id={`p1an-daily-aim-${userId}`}
              variant="outline"
              className={cn(
                'border-2 px-3 py-2',
                hasDailyAim
                  ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100'
                  : 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100',
              )}
              onClick={() => setShowDailyAim(true)}
            >
              {review ? 'Review daily aim' : 'Daily Aim'}
            </Button>
            {(startMinute !== DEFAULT_START || endMinute !== DEFAULT_END) && (
              <button
                id={`p1an-close-range-${userId}`}
                className="rounded border px-2 py-1"
                onClick={() => {
                  setStartMinute(DEFAULT_START);
                  setEndMinute(DEFAULT_END);
                }}
              >
                Close
              </button>
            )}
            <PlanningDateNav date={date} today={today} />
            {loadSuccessMessage && (
              <div className="w-full rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-600">
                {loadSuccessMessage}
              </div>
            )}
          </div>
      {showCustom && (
        <div
          className="sticky top-[48px] z-10 flex items-center gap-2 bg-gray-50 p-2 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
              <span>Start:</span>
              <input
                type="time"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border p-1"
              />
              <span>End:</span>
              <input
                type="time"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border p-1"
              />
              <button
                className="rounded border px-2 py-1"
                onClick={applyCustomRange}
              >
                Apply
              </button>
            </div>
          )}
          <div style={{ height: TIMELINE_HEIGHT }} className="relative">
            <div className="absolute left-0 top-0 w-12">
              {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                const h = startHour + i;
                const translate =
                  h === startHour ? '0' : h === endHour ? '-100%' : '-50%';
                return (
                  <span
                    key={h}
                    className="absolute right-1 text-[10px] text-gray-500"
                    style={{
                      top: (h * 60 - startMinute) * PIXELS_PER_MINUTE,
                      transform: `translateY(${translate})`,
                    }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>
                );
              })}
            </div>
            <div className="absolute left-12 right-0 top-0">
              {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                const h = startHour + i;
                return (
                  <div key={h}>
                    <div
                      id={`p1an-hour-${h}-${userId}`}
                      className="absolute left-0 right-0 border-t border-gray-300"
                      style={{
                        top: (h * 60 - startMinute) * PIXELS_PER_MINUTE,
                      }}
                    />
                    {h < endHour &&
                      [15, 30, 45].map((m) => (
                        <div
                          key={m}
                          className="absolute left-0 right-0 border-t border-gray-100"
                          style={{
                            top: (h * 60 + m - startMinute) * PIXELS_PER_MINUTE,
                          }}
                        />
                      ))}
                  </div>
                );
              })}
              {sortedBlocks.map((b) => {
                const bStart = minutesFromIso(b.start);
                const bEnd = minutesFromIso(b.end);
                if (bEnd <= startMinute || bStart >= endMinute) return null;
                const top =
                  (Math.max(bStart, startMinute) - startMinute) *
                  PIXELS_PER_MINUTE;
                const height =
                  (Math.min(bEnd, endMinute) - Math.max(bStart, startMinute)) *
                  PIXELS_PER_MINUTE;
                const z = (blockDepth[b.id] || 0) * Z_BASE + (Z_BASE - bStart);
                const textColor = getTextColor(b.color);
                const fontSize = Math.min(20, Math.max(12, height / 2));
                return (
                  <div
                    key={b.id}
                    id={`p1an-blk-${b.id}-${userId}`}
                    data-selected={selectedId === b.id ? 'true' : 'false'}
                    aria-label={`${b.title}, ${b.start} to ${b.end}`}
                    className="absolute left-1 right-1 rounded p-1"
                    style={{
                      top,
                      height,
                      background: b.color,
                      zIndex: z,
                      color: textColor,
                      cursor: review
                        ? !live || reviewDayHasPassed || nowMinute >= minutesFromIso(b.end)
                          ? 'pointer'
                          : 'not-allowed'
                        : editable
                          ? 'move'
                          : 'default',
                    }}
                    onPointerMove={(e) => {
                      if (!editable || review) return;
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      const offset = e.clientY - rect.top;
                      (e.currentTarget as HTMLElement).style.cursor =
                        offset < 8 || rect.height - offset < 8
                          ? 'ns-resize'
                          : 'move';
                    }}
                    onPointerLeave={(e) => {
                      if (!editable || review) return;
                      (e.currentTarget as HTMLElement).style.cursor = 'move';
                    }}
                    onPointerDown={(e) => {
                      if (!editable || review) return;
                      e.stopPropagation();
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      const offset = e.clientY - rect.top;
                      const mode =
                        offset < 8
                          ? 'start'
                          : rect.height - offset < 8
                            ? 'end'
                            : 'move';
                      onDragStart(e, b, mode, draggingRef);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (draggingRef.current) return;
                      if (
                        review &&
                        live &&
                        !reviewDayHasPassed &&
                        nowMinute < minutesFromIso(b.end)
                      )
                        return;
                      openMeta(b.id);
                    }}
                  >
                    <span
                      className="pointer-events-none block truncate font-bold"
                      style={{ fontSize }}
                    >
                      {b.title}
                    </span>
                  </div>
                );
              })}
              {live && nowMinute >= startMinute && nowMinute <= endMinute && (
                <div
                  id={`p1an-now-${userId}`}
                  className="pointer-events-none absolute left-0 right-0 border-t-2 border-dotted"
                  style={{
                    top: (nowMinute - startMinute) * PIXELS_PER_MINUTE,
                    borderColor: lineColor,
                    zIndex: 999999,
                  }}
                >
                  <div
                    className="absolute -left-2 -top-1 h-2 w-2 rounded-full"
                    style={{ background: lineColor }}
                  />
                </div>
              )}
            </div>
          </div>
          {!review &&
            (editable ? (
              <button
                id={`p1an-add-fab-${userId}`}
                onClick={(e) => {
                  e.stopPropagation();
                  addBlock();
                }}
                className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-orange-500 text-white"
                disabled={!editable}
              >
                +
              </button>
            ) : (
              <button
                id={`p1an-add-fab-${userId}`}
                className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-orange-500 text-white"
                disabled
                title="Read-only in viewing mode"
              >
                +
              </button>
            ))}
        </div>
        {selected ? (
          <div
            className="relative w-1/2 max-h-[90vh] overflow-y-auto border-l p-4"
            id={`p1an-meta-${selected.id}-${userId}`}
          >
            {editable && (
              <div className="absolute right-4 top-4" ref={blockMenuRef}>
                <button
                  type="button"
                  aria-label="Activity block actions"
                  className="rounded px-2 py-1 text-xl leading-none hover:bg-gray-100"
                  onClick={() => setShowBlockPresetMenu((s) => !s)}
                >
                  ⋮
                </button>
                {showBlockPresetMenu && (
                  <div className="mt-1 w-48 rounded border bg-white text-sm shadow">
                    <button
                      type="button"
                      className="flex w-full items-center px-3 py-2 text-left hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                      onClick={openSaveBlockPresetDialog}
                      disabled={!canSaveBlockPreset}
                    >
                      Save activity block
                    </button>
                  </div>
                )}
              </div>
            )}
            {review ? (
              <>
                <div className="mb-2 text-sm text-gray-500">
                  {editable ? null : 'Read-only (viewing mode)'}
                </div>
                <div className="mb-4">
                  <div
                    id={`p1an-meta-ttl-${selected.id}-${userId}`}
                    className="font-semibold"
                  >
                    {selected.title}
                  </div>
                  <div className="mt-1">
                    {selected.description ? (
                      <pre
                        id={`p1an-meta-dsc-${selected.id}-${userId}`}
                        className="whitespace-pre-wrap rounded border p-2 text-sm"
                      >
                        {selected.description}
                      </pre>
                    ) : (
                      <div
                        id={`p1an-meta-dsc-${selected.id}-${userId}`}
                        className="rounded border p-2 text-sm text-gray-500"
                      >
                        No description provided
                      </div>
                    )}
                  </div>
                </div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-good-${selected.id}-${userId}`}
                >
                  What went good?
                </label>
                <textarea
                  id={`p1an-meta-good-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={reviews[selected.id]?.good ?? ''}
                  disabled={!editable}
                  maxLength={1000}
                  rows={6}
                  onChange={(e) =>
                    setReviews((prev) => ({
                      ...prev,
                      [selected.id]: {
                        ...(prev[selected.id] || {
                          good: '',
                          bad: '',
                          ingredients: {},
                        }),
                        good: e.target.value,
                      },
                    }))
                  }
                />
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-bad-${selected.id}-${userId}`}
                >
                  What went bad?
                </label>
                <textarea
                  id={`p1an-meta-bad-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={reviews[selected.id]?.bad ?? ''}
                  disabled={!editable}
                  maxLength={1000}
                  rows={6}
                  onChange={(e) =>
                    setReviews((prev) => ({
                      ...prev,
                      [selected.id]: {
                        ...(prev[selected.id] || {
                          good: '',
                          bad: '',
                          ingredients: {},
                        }),
                        bad: e.target.value,
                      },
                    }))
                  }
                />
                {Object.entries(reviews[selected.id]?.ingredients ?? {}).map(
                  ([iidStr, text]) => {
                    const iid = Number(iidStr);
                    const ing = initialIngredients.find((i) => i.id === iid);
                    const src = ing?.icon ? iconSrc(ing.icon) : null;
                    const link =
                      ing &&
                      (viewId
                        ? `/view/${viewId}/ingredient/${ing.id}`
                        : `/ingredient/${ing.id}`);
                    return (
                      <div key={iid} className="mb-2">
                        <div className="mb-1 flex items-center justify-between">
                          {link ? (
                            <Link
                              href={link}
                              className="flex items-center gap-1"
                            >
                              {src ? (
                                <img src={src} alt="" className="h-4 w-4" />
                              ) : (
                                <span>{ing?.icon ?? '❓'}</span>
                              )}
                              <span className="text-sm">
                                {ing?.title ?? 'Secret 🔒'}
                              </span>
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1">
                              {src ? (
                                <img src={src} alt="" className="h-4 w-4" />
                              ) : (
                                <span>{ing?.icon ?? '❓'}</span>
                              )}
                              <span className="text-sm">
                                {ing?.title ?? 'Secret 🔒'}
                              </span>
                            </span>
                          )}
                          {editable && (
                            <button
                              className="text-sm"
                              onClick={() =>
                                removeIngredientReview(selected.id, iid)
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <textarea
                          className="w-full border p-1"
                          value={text}
                          disabled={!editable}
                          maxLength={1000}
                          rows={3}
                          onChange={(e) =>
                            setReviews((prev) => ({
                              ...prev,
                              [selected.id]: {
                                ...(prev[selected.id] || {
                                  good: '',
                                  bad: '',
                                  ingredients: {},
                                }),
                                ingredients: {
                                  ...(prev[selected.id]?.ingredients || {}),
                                  [iid]: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    );
                  },
                )}
                <label className="block text-sm font-medium">Ingredients</label>
                <div
                  id={`p1an-meta-igrd-${selected.id}-${userId}`}
                  className="mb-2 flex flex-wrap gap-2"
                >
                  {unreviewedIngredientIds.length === 0 && (
                    <span
                      id={`p1an-meta-igrd-none-${selected.id}-${userId}`}
                      className="text-sm text-gray-500"
                    >
                      No ingredient found
                    </span>
                  )}
                  {unreviewedIngredientIds.map((iid) => {
                    const ing = initialIngredients.find((i) => i.id === iid);
                    const src = ing?.icon ? iconSrc(ing.icon) : null;
                    const selectable = selectIngredient && editable;
                    const content = (
                      <>
                        {src ? (
                          <img src={src} alt="" className="h-4 w-4" />
                        ) : (
                          <span>{ing?.icon ?? '❓'}</span>
                        )}
                        <span className="text-sm">
                          {ing?.title ?? 'Secret 🔒'}
                        </span>
                      </>
                    );
                    const link =
                      ing &&
                      !selectable &&
                      (viewId
                        ? `/view/${viewId}/ingredient/${ing.id}`
                        : `/ingredient/${ing.id}`);
                    const cls = cn(
                      'flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow',
                      selectable ? 'cursor-pointer hover:bg-gray-200' : '',
                    );
                    if (link) {
                      return (
                        <Link key={iid} href={link} className={cls}>
                          {content}
                        </Link>
                      );
                    }
                    return (
                      <div
                        key={iid}
                        className={cls}
                        onClick={() => {
                          if (selectable) {
                            addIngredientReview(selected.id, iid);
                            setSelectIngredient(false);
                          }
                        }}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
                {editable && unreviewedIngredientIds.length > 0 && (
                  <Button
                    id={`p1an-meta-igrd-review-${selected.id}-${userId}`}
                    variant="outline"
                    size="sm"
                    className="mb-2"
                    onClick={() => setSelectIngredient((s) => !s)}
                  >
                    {selectIngredient
                      ? 'Cancel ingredient feedback'
                      : 'Write feedback on ingredient'}
                  </Button>
                )}
                {selectIngredient && (
                  <div className="mb-2 text-sm text-gray-500">
                    Select an ingredient above
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    id={`p1an-meta-close-${userId}`}
                    onClick={closeMeta}
                  >
                    X
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 text-sm text-gray-500">
                  {editable ? null : 'Read-only (viewing mode)'}
                </div>
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-ttl-${selected.id}-${userId}`}
                >
                  Activity
                </label>
                <input
                  id={`p1an-meta-ttl-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={selected.title}
                  maxLength={60}
                  disabled={!editable}
                  onChange={(e) =>
                    updateBlock(selected.id, { title: e.target.value })
                  }
                />
                <label
                  className="block text-sm font-medium"
                  htmlFor={`p1an-meta-dsc-${selected.id}-${userId}`}
                >
                  Description
                </label>
                <textarea
                  id={`p1an-meta-dsc-${selected.id}-${userId}`}
                  className="mb-2 w-full border p-1"
                  value={selected.description}
                  disabled={!editable}
                  maxLength={500}
                  rows={6}
                  onChange={(e) =>
                    updateBlock(selected.id, { description: e.target.value })
                  }
                />
                <label className="block text-sm font-medium">Color</label>
                <div
                  id={`p1an-meta-col-${selected.id}-${userId}`}
                  className="mb-2 flex flex-wrap gap-1"
                >
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className="h-6 w-6 rounded"
                      style={{ background: c }}
                      onClick={() =>
                        editable &&
                        updateBlock(selected.id, { color: c, colorPreset: '' })
                      }
                      disabled={!editable}
                    />
                  ))}
                </div>
                {selected.colorPreset && (
                  <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                    <span>Preset: {selected.colorPreset}</span>
                    {editable && (
                      <button
                        aria-label="Remove preset"
                        className="rounded px-1 hover:bg-gray-200"
                        onClick={() =>
                          updateBlock(selected.id, { colorPreset: '' })
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                {(editable || viewerId) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-2"
                      id={`p1an-meta-col-pre-${selected.id}-${userId}`}
                      onClick={() => setShowPresetPicker((s) => !s)}
                    >
                      Presets
                    </Button>
                    {showPresetPicker && (
                      <ColorPresetPicker
                        userId={currentUserId}
                        foreignPresets={
                          currentUserId !== userId ? foreignPresets : undefined
                        }
                        initialCustom={
                          !editable && currentUserId === userId
                            ? initialPlan?.colorPresets
                            : undefined
                        }
                        onSelect={({ id, name, color }) => {
                          if (editable) {
                            updateBlock(selected.id, {
                              color,
                              colorPreset: name,
                            });
                          } else {
                            if (viewerId == null) {
                              // Viewer isn't signed in, so copying would save to
                              // the plan owner's library. Block the action and
                              // prompt them to log in first.
                              alert('Please sign in to copy presets.');
                            } else if (window.confirm('Copy to own presets?')) {
                              // Save the preset under the viewer's ID so it
                              // appears in their personal library regardless
                              // of which plan/date they copied it from.
                              addUserColorPreset(currentUserId, {
                                name,
                                colors: [color],
                              });
                              alert('Preset copied.');
                            }
                          }
                          setShowPresetPicker(false);
                        }}
                        onClose={() => setShowPresetPicker(false)}
                      />
                    )}
                  </>
                )}
                <div className="mb-2 flex gap-2">
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`p1an-meta-tms-${selected.id}-${userId}`}
                    >
                      Start
                    </label>
                    <input
                      type="time"
                      id={`p1an-meta-tms-${selected.id}-${userId}`}
                      value={formatTime(selected.start)}
                      disabled={!editable}
                      onChange={(e) =>
                        handleTimeChange(selected.id, 'start', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`p1an-meta-tme-${selected.id}-${userId}`}
                    >
                      End
                    </label>
                    <input
                      type="time"
                      id={`p1an-meta-tme-${selected.id}-${userId}`}
                      value={formatTime(selected.end)}
                      disabled={!editable}
                      onChange={(e) =>
                        handleTimeChange(selected.id, 'end', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Ingredients
                  </label>
                  <div
                    id={`p1an-meta-igrd-${selected.id}-${userId}`}
                    className="mb-2 flex flex-wrap gap-2"
                  >
                    {(selected.ingredientIds ?? []).length === 0 && (
                      <span
                        id={`p1an-meta-igrd-none-${selected.id}-${userId}`}
                        className="text-sm text-gray-500"
                      >
                        No ingredient found
                      </span>
                    )}
                    {(selected.ingredientIds ?? []).map((iid) => {
                      const ing = initialIngredients.find((i) => i.id === iid);
                      const src = ing?.icon ? iconSrc(ing.icon) : null;
                      const content = (
                        <>
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{ing?.icon ?? '❓'}</span>
                          )}
                          <span className="text-sm">
                            {ing?.title ?? 'Secret 🔒'}
                          </span>
                          {editable && ing && (
                            <span
                              className="ml-1 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeIngredient(selected.id, iid);
                              }}
                            >
                              ×
                            </span>
                          )}
                        </>
                      );
                      const link =
                        ing &&
                        (viewId
                          ? `/view/${viewId}/ingredient/${ing.id}`
                          : `/ingredient/${ing.id}`);
                      return link ? (
                        <Link
                          key={iid}
                          href={link}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          key={iid}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </span>
                      );
                    })}
                    {editable && (
                      <Link
                        id={`p1an-meta-igrd-add-${selected.id}-${userId}`}
                        href={`/ingredientsforplanning?date=${date}&block=${selected.id}&mode=${mode}`}
                        className="rounded-full bg-green-200 px-3 py-1 text-green-800 shadow"
                      >
                        Add ingredients +
                      </Link>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Flavors</label>
                  <div
                    id={`p1an-meta-flav-${selected.id}-${userId}`}
                    className="mb-2 flex flex-wrap gap-2"
                  >
                    {(selected.flavorIds ?? []).length === 0 &&
                      (selected.subflavorIds ?? []).length === 0 && (
                        <span className="text-sm text-gray-500">
                          No flavor selected
                        </span>
                      )}
                    {(selected.flavorIds ?? []).map((fid) => {
                      const fl = flavors.find((f) => f.id === fid);
                      const src = fl?.icon ? iconSrc(fl.icon) : null;
                      const content = (
                        <>
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{fl?.icon ?? '❓'}</span>
                          )}
                          <span className="text-sm">
                            {fl?.name ?? 'Secret 🔒'}
                          </span>
                          {editable && fl && (
                            <span
                              className="ml-1 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFlavor(selected.id, fid);
                              }}
                            >
                              ×
                            </span>
                          )}
                        </>
                      );
                      const link =
                        fl &&
                        (viewMode === 'historical'
                          ? viewerId === ownerId
                            ? `/history/self/${snapshotDate}/flavors/${fl.id}`
                            : viewId
                              ? `/history/${viewId}/${snapshotDate}/flavors/${fl.id}`
                              : null
                          : viewId
                            ? `/view/${viewId}/flavor/${fl.id}`
                            : `/flavor/${fl.id}`);
                      return link ? (
                        <Link
                          key={fid}
                          href={link}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          key={fid}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </span>
                      );
                    })}
                    {(selected.subflavorIds ?? []).map((sid) => {
                      const sub = subflavors.find((s) => s.id === sid);
                      const src = sub?.icon ? iconSrc(sub.icon) : null;
                      const content = (
                        <>
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{sub?.icon ?? '❓'}</span>
                          )}
                          <span className="text-sm">
                            {sub?.name ?? 'Secret 🔒'}
                          </span>
                          {editable && sub && (
                            <span
                              className="ml-1 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeSubflavor(selected.id, sid);
                              }}
                            >
                              ×
                            </span>
                          )}
                        </>
                      );
                      const link =
                        sub &&
                        (viewMode === 'historical'
                          ? viewerId === ownerId
                            ? `/history/self/${snapshotDate}/flavors/${sub.flavorId}/subflavors#s7ubflavourrow${sub.id}-${ownerId}`
                            : viewId
                              ? `/history/${viewId}/${snapshotDate}/flavors/${sub.flavorId}/subflavors#s7ubflavourrow${sub.id}-${ownerId}`
                              : null
                          : viewId
                            ? `/view/${viewId}/subflavor/${sub.id}`
                            : `/subflavor/${sub.id}`);
                      return link ? (
                        <Link
                          key={sid}
                          href={link}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          key={sid}
                          className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 shadow"
                        >
                          {content}
                        </span>
                      );
                    })}
                    {editable && (
                      <button
                        id={`p1an-meta-flav-add-${selected.id}-${userId}`}
                        type="button"
                        className="flex items-center gap-1 rounded-full bg-orange-200 px-3 py-1 text-orange-800 shadow"
                        onClick={() => setSelectFlavor(true)}
                      >
                        <span>+</span>
                        <span>Reasoning behind activity</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {editable ? (
                    <Button
                      variant="outline"
                      className="border-red-600 text-red-600"
                      id={`p1an-meta-del-${userId}`}
                      onClick={() => {
                        setBlocks((prev) =>
                          prev.filter((blk) => blk.id !== selected.id),
                        );
                        closeMeta();
                      }}
                    >
                      Delete
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-red-600 text-red-600"
                      id={`p1an-meta-del-${userId}`}
                      disabled
                      title="Read-only in viewing mode"
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    id={`p1an-meta-close-${userId}`}
                    onClick={closeMeta}
                  >
                    X
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      {showDailyAim && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDailyAim(false);
          }}
        >
          <div className="relative w-[90vw] max-h-[90vh] overflow-y-auto sm:w-[50vw] sm:max-w-xl rounded bg-white p-10 sm:p-20 shadow-lg">
            <button
              id={`p1an-day-x-${userId}`}
              className="absolute left-4 top-4 text-gray-500"
              onClick={() => setShowDailyAim(false)}
            >
              X
            </button>
            {review ? (
              <>
                <h2 className="mb-4 text-lg font-semibold text-center">
                  Review daily aim
                </h2>
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="md:w-1/2 max-h-[60vh]">
                    <span className="mb-2 block text-sm font-medium">
                      Daily aim
                    </span>
                    {dailyAim ? (
                      <pre className="max-h-[60vh] w-full overflow-y-auto whitespace-pre-wrap rounded border p-6">
                        {dailyAim}
                      </pre>
                    ) : (
                      <div className="max-h-[60vh] w-full overflow-y-auto rounded border p-6">
                        <span className="text-sm text-gray-500">
                          No daily aim set
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex max-h-[60vh] flex-col overflow-y-auto md:w-1/2">
                    <label
                      className="block text-sm font-medium"
                      htmlFor={`p1an-day-feedback-${userId}`}
                    >
                      How did your day go?
                    </label>
                    <textarea
                      id={`p1an-day-feedback-${userId}`}
                      className="mb-4 h-40 w-full border p-4"
                      value={reviews['day']?.good ?? ''}
                      disabled={!editable}
                      maxLength={1000}
                      onChange={(e) =>
                        setReviews((prev) => ({
                          ...prev,
                          day: {
                            ...(prev.day || {
                              good: '',
                              bad: '',
                              ingredients: {},
                            }),
                            good: e.target.value,
                          },
                        }))
                      }
                    />
                    <div className="mb-2 pl-4">
                      <span className="block text-sm font-medium">
                        Daily ingredients
                      </span>
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
                          const ing = initialIngredients.find(
                            (i) => i.id === iid,
                          );
                          const src = ing?.icon ? iconSrc(ing.icon) : null;
                          const selectable = selectDailyIngredient && editable;
                          const content = (
                            <>
                              {src ? (
                                <img src={src} alt="" className="h-4 w-4" />
                              ) : (
                                <span>{ing?.icon ?? '❓'}</span>
                              )}
                              <span className="text-sm">
                                {ing?.title ?? 'Secret 🔒'}
                              </span>
                            </>
                          );
                          const link =
                            ing &&
                            !selectable &&
                            (viewId
                              ? `/view/${viewId}/ingredient/${ing.id}`
                              : `/ingredient/${ing.id}`);
                          const cls = cn(
                            'flex items-center gap-1 rounded border px-2 py-1',
                            selectable
                              ? 'cursor-pointer bg-gray-100 hover:bg-gray-200'
                              : '',
                          );
                          if (link) {
                            return (
                              <Link key={iid} href={link} className={cls}>
                                {content}
                              </Link>
                            );
                          }
                          return (
                            <div
                              key={iid}
                              className={cls}
                              onClick={() => {
                                if (selectable) {
                                  addIngredientReview('day', iid);
                                  setSelectDailyIngredient(false);
                                }
                              }}
                            >
                              {content}
                            </div>
                          );
                        })}
                      </div>
                      {Object.entries(reviews['day']?.ingredients ?? {}).map(
                        ([iidStr, text]) => {
                          const iid = Number(iidStr);
                          const ing = initialIngredients.find(
                            (i) => i.id === iid,
                          );
                          const src = ing?.icon ? iconSrc(ing.icon) : null;
                          const link =
                            ing &&
                            (viewId
                              ? `/view/${viewId}/ingredient/${ing.id}`
                              : `/ingredient/${ing.id}`);
                          return (
                            <div key={iid} className="mb-2">
                              <div className="mb-1 flex items-center justify-between">
                                {link ? (
                                  <Link
                                    href={link}
                                    className="flex items-center gap-1"
                                  >
                                    {src ? (
                                      <img
                                        src={src}
                                        alt=""
                                        className="h-4 w-4"
                                      />
                                    ) : (
                                      <span>{ing?.icon ?? '❓'}</span>
                                    )}
                                    <span className="text-sm">
                                      {ing?.title ?? 'Secret 🔒'}
                                    </span>
                                  </Link>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    {src ? (
                                      <img
                                        src={src}
                                        alt=""
                                        className="h-4 w-4"
                                      />
                                    ) : (
                                      <span>{ing?.icon ?? '❓'}</span>
                                    )}
                                    <span className="text-sm">
                                      {ing?.title ?? 'Secret 🔒'}
                                    </span>
                                  </span>
                                )}
                                {editable && (
                                  <button
                                    className="text-sm"
                                    onClick={() =>
                                      removeIngredientReview('day', iid)
                                    }
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <textarea
                                className="w-full border p-1"
                                value={text}
                                disabled={!editable}
                                maxLength={1000}
                                rows={3}
                                onChange={(e) =>
                                  setReviews((prev) => ({
                                    ...prev,
                                    day: {
                                      ...(prev.day || {
                                        good: '',
                                        bad: '',
                                        ingredients: {},
                                      }),
                                      ingredients: {
                                        ...(prev.day?.ingredients || {}),
                                        [iid]: e.target.value,
                                      },
                                    },
                                  }))
                                }
                              />
                            </div>
                          );
                        },
                      )}
                      {editable && unreviewedDailyIngredientIds.length > 0 && (
                        <Button
                          id={`p1an-day-igrd-review-${userId}`}
                          variant="outline"
                          size="sm"
                          className="mb-2"
                          onClick={() => setSelectDailyIngredient((s) => !s)}
                        >
                          {selectDailyIngredient
                            ? 'Cancel ingredient feedback'
                            : 'Write feedback on ingredient'}
                        </Button>
                      )}
                      {selectDailyIngredient && (
                        <div className="mb-2 text-sm text-gray-500">
                          Select an ingredient above
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <Button
                    variant="outline"
                    id={`p1an-day-done-${userId}`}
                    onClick={() => setShowDailyAim(false)}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold text-center">
                  Daily Aim
                </h2>
                <textarea
                  id={`p1an-day-aim-${userId}`}
                  className="mb-8 w-full resize-y border p-6"
                  value={dailyAim}
                  onChange={(e) => setDailyAim(e.target.value)}
                  rows={16}
                  maxLength={500}
                  disabled={!editable}
                />
                <div className="mb-2 pl-4">
                  <span className="block text-sm font-medium">
                    Daily ingredients
                  </span>
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
                      const content = (
                        <>
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{ing?.icon ?? '❓'}</span>
                          )}
                          <span className="text-sm">
                            {ing?.title ?? 'Secret 🔒'}
                          </span>
                          {editable && ing && (
                            <button
                              type="button"
                              className="ml-1 text-xs text-red-500"
                              onClick={() => removeDailyIngredient(iid)}
                            >
                              X
                            </button>
                          )}
                        </>
                      );
                      const link =
                        ing &&
                        (viewId
                          ? `/view/${viewId}/ingredient/${ing.id}`
                          : `/ingredient/${ing.id}`);
                      return link ? (
                        <Link
                          key={iid}
                          id={`p1an-day-igrd-${iid}-${userId}`}
                          href={link}
                          className="flex items-center gap-1 rounded border px-2 py-1"
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          key={iid}
                          className="flex items-center gap-1 rounded border px-2 py-1"
                        >
                          {content}
                        </span>
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
                    onClick={() => setShowDailyAim(false)}
                  >
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showLoadPlanning && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLoadPlanningModal();
          }}
        >
          <div className="flex h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-lg bg-white p-4 text-sm shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Load planning</h2>
                <p className="text-xs text-gray-500">
                  Borrow a past plan to jump-start tomorrow&apos;s schedule.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="rounded bg-gray-100 px-2 py-1 text-lg leading-none text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                onClick={closeLoadPlanningModal}
              >
                ×
              </button>
            </div>
            {loadStep === 'calendar' ? (
              <div className="grid flex-1 gap-6 overflow-y-auto md:grid-cols-[1.4fr,1fr]">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label="Previous month"
                      className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
                      onClick={() =>
                        setLoadMonth(
                          new Date(
                            loadMonth.getFullYear(),
                            loadMonth.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                    >
                      ❮
                    </button>
                    <div className="text-base font-semibold text-gray-800">
                      {loadMonthLabel}
                    </div>
                    <button
                      type="button"
                      aria-label="Next month"
                      className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
                      onClick={() =>
                        setLoadMonth(
                          new Date(
                            loadMonth.getFullYear(),
                            loadMonth.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                    >
                      ❯
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {WEEK_DAYS.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {loadCalendarDays.map((d) => {
                      const iso = d.toISOString().slice(0, 10);
                      const isCurrentMonth =
                        d.getMonth() === loadMonth.getMonth();
                      const hasPlan = availablePlanDates.has(iso);
                      const isSelected = loadSelectedDate === iso;
                      const isToday = iso === today;
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={!hasPlan}
                          onClick={() => {
                            setLoadSelectedDate(iso);
                            setLoadError(null);
                          }}
                          className={cn(
                            'flex h-10 items-center justify-center rounded-md border text-sm transition',
                            hasPlan
                              ? 'border-orange-200 bg-white text-gray-900 hover:bg-orange-50'
                              : 'border-transparent bg-gray-100 text-gray-400',
                            !isCurrentMonth && 'opacity-60',
                            isToday && !isSelected && 'border-orange-400',
                            isSelected &&
                              'border-orange-500 bg-orange-500 text-white hover:bg-orange-500',
                            hasPlan ? 'cursor-pointer' : 'cursor-not-allowed',
                          )}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  {planDates.length === 0 && (
                    <p className="mt-6 rounded border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
                      No saved plans yet. Create a plan to unlock quick loading.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="rounded border border-orange-200 bg-orange-50 px-4 py-3 text-orange-700">
                    <p className="text-sm font-semibold">Choose a day</p>
                    <p className="mt-1 text-xs">
                      Orange dates hold finished plans. Preview them or copy instantly into
                      tomorrow.
                    </p>
                  </div>
                  {loadSelectedDate ? (
                    <div className="rounded border border-gray-200 px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatLoadDateLabel(loadSelectedDate)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Preview to double-check the schedule or select to copy it right away.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewPlan(loadSelectedDate)}
                          disabled={loadFetching || loadApplying}
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSelectPlan(loadSelectedDate)}
                          disabled={loadFetching || loadApplying}
                        >
                          {loadFetching ? 'Selecting…' : 'Select'}
                        </Button>
                      </div>
                      {loadError && (
                        <p className="mt-2 text-xs text-red-500">{loadError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500">
                      Pick a highlighted day to unlock preview and select actions.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {loadPreviewDate ? formatLoadDateLabel(loadPreviewDate) : 'Preview'}
                    </div>
                    <p className="text-xs text-gray-500">
                      This is how your plan looked on that day.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setLoadStep('calendar');
                      setLoadError(null);
                      setLoadPreviewPlan(null);
                      setLoadPreviewDate(null);
                    }}
                  >
                    Back to calendar
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto rounded border border-gray-100 bg-gray-50 p-4">
                  {loadPreviewLoading ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500">
                      Loading preview…
                    </div>
                  ) : loadError ? (
                    <div className="rounded border border-red-200 bg-red-50 p-4 text-xs text-red-600">
                      {loadError}
                    </div>
                  ) : loadPreviewPlan ? (
                    <div className="space-y-4">
                      {(loadPreviewPlan.dailyAim ||
                        (loadPreviewPlan.dailyIngredientIds ?? []).length > 0) && (
                        <div className="rounded border border-orange-200 bg-white p-4 shadow-sm">
                          {loadPreviewPlan.dailyAim && (
                            <div>
                              <div className="text-xs font-semibold uppercase text-orange-500">
                                Daily aim
                              </div>
                              <p className="mt-1 text-sm text-gray-700">
                                {loadPreviewPlan.dailyAim}
                              </p>
                            </div>
                          )}
                          {(loadPreviewPlan.dailyIngredientIds ?? []).length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase text-orange-500">
                                Daily ingredients
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-green-700">
                                {loadPreviewPlan.dailyIngredientIds.map((iid) => {
                                  const ing = initialIngredients.find((i) => i.id === iid);
                                  return (
                                    <span
                                      key={iid}
                                      className="rounded bg-green-100 px-2 py-0.5"
                                    >
                                      {ing?.title ?? 'Secret 🔒'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="space-y-3">
                        {loadPreviewPlan.blocks.length ? (
                          [...loadPreviewPlan.blocks]
                            .sort(
                              (a, b) =>
                                new Date(a.start).getTime() - new Date(b.start).getTime(),
                            )
                            .map((b) => {
                              const ingredientNames = (b.ingredientIds ?? [])
                                .map((iid) => initialIngredients.find((i) => i.id === iid)?.title)
                                .filter(Boolean);
                              const flavorNames = (b.flavorIds ?? [])
                                .map((fid) => flavors.find((f) => f.id === fid)?.name)
                                .filter(Boolean);
                              const subNames = (b.subflavorIds ?? [])
                                .map((sid) => subflavors.find((s) => s.id === sid)?.name)
                                .filter(Boolean);
                              return (
                                <div
                                  key={`${b.id}-${b.start}`}
                                  className="rounded border border-gray-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-gray-900">
                                    <span>{b.title || 'Untitled activity'}</span>
                                    {loadPreviewDate && (
                                      <span className="text-xs font-medium text-gray-500">
                                        {formatPreviewRange(b, loadPreviewDate)}
                                      </span>
                                    )}
                                  </div>
                                  {b.description && (
                                    <p className="mt-1 text-xs text-gray-600">
                                      {b.description}
                                    </p>
                                  )}
                                  {flavorNames.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-orange-600">
                                      {flavorNames.map((name, idx) => (
                                        <span
                                          key={`${b.id}-flavor-${idx}`}
                                          className="rounded bg-orange-100 px-2 py-0.5"
                                        >
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {subNames.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-purple-600">
                                      {subNames.map((name, idx) => (
                                        <span
                                          key={`${b.id}-sub-${idx}`}
                                          className="rounded bg-purple-100 px-2 py-0.5"
                                        >
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {ingredientNames.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-green-700">
                                      {ingredientNames.map((name, idx) => (
                                        <span
                                          key={`${b.id}-ing-${idx}`}
                                          className="rounded bg-green-100 px-2 py-0.5"
                                        >
                                          {name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        ) : (
                          <div className="rounded border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
                            No activities were saved for this day.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500">
                      No data available for this day.
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setLoadStep('calendar');
                      setLoadError(null);
                      setLoadPreviewPlan(null);
                      setLoadPreviewDate(null);
                    }}
                  >
                    Select another date
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyPreview}
                    disabled={!loadPreviewPlan || loadApplying}
                  >
                    {loadApplying ? 'Adding…' : 'Add now'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showSavePresetDialog && selected && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSavePresetDialog(false);
          }}
        >
          <div className="w-[90vw] max-w-md rounded bg-white p-4 text-sm shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Save activity block</h2>
              <button
                type="button"
                aria-label="Close"
                className="text-lg leading-none text-gray-500 hover:text-gray-800"
                onClick={() => setShowSavePresetDialog(false)}
              >
                ×
              </button>
            </div>
            <label className="block text-xs font-semibold uppercase text-gray-500">
              Name
            </label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={savePresetName}
              onChange={(e) => setSavePresetName(e.target.value)}
              maxLength={80}
              placeholder="Morning focus sprint"
            />
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase text-gray-500">
                Categories
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select one or more categories to quickly find this block later.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sortedCategories.length > 0 ? (
                  sortedCategories.map((cat) => {
                    const active = savePresetCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={cn(
                          'rounded border px-3 py-1 text-xs transition',
                          active
                            ? 'border-orange-500 bg-orange-100 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100',
                        )}
                        onClick={() => toggleSavePresetCategory(cat.id)}
                      >
                        {cat.name}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-500">
                    No categories yet — add one below.
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="w-full rounded border px-3 py-2 text-xs"
                  value={newPresetCategoryName}
                  onChange={(e) => setNewPresetCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateDialogCategory();
                    }
                  }}
                  placeholder="Add category (e.g. Morning)"
                  maxLength={40}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateDialogCategory}
                  disabled={!newPresetCategoryName.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowSavePresetDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveBlockPreset}
                disabled={!savePresetName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {showPresetLibrary && canUsePresetLibrary && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPresetLibrary(false);
          }}
        >
          <div className="flex h-[90vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded bg-white p-4 text-sm shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Custom timeslots</h2>
              <button
                type="button"
                aria-label="Close"
                className="text-lg leading-none text-gray-500 hover:text-gray-800"
                onClick={() => setShowPresetLibrary(false)}
              >
                ×
              </button>
            </div>
            <div className="flex flex-1 gap-4 overflow-hidden">
              <div className="w-60 shrink-0 border-r pr-3">
                <div className="text-xs font-semibold uppercase text-gray-500">
                  Categories
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded px-2 py-1 text-left transition',
                      activePresetCategory === 'all'
                        ? 'bg-orange-100 text-orange-700'
                        : 'hover:bg-gray-100',
                    )}
                    onClick={() => setActivePresetCategory('all')}
                  >
                    All presets
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded px-2 py-1 text-left transition',
                      activePresetCategory === 'uncategorized'
                        ? 'bg-orange-100 text-orange-700'
                        : 'hover:bg-gray-100',
                    )}
                    onClick={() => setActivePresetCategory('uncategorized')}
                  >
                    Uncategorized
                  </button>
                  {sortedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={cn(
                        'w-full rounded px-2 py-1 text-left transition',
                        activePresetCategory === cat.id
                          ? 'bg-orange-100 text-orange-700'
                          : 'hover:bg-gray-100',
                      )}
                      onClick={() => setActivePresetCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Add category
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      className="w-full rounded border px-2 py-1 text-xs"
                      value={libraryCategoryName}
                      onChange={(e) => setLibraryCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateLibraryCategory();
                        }
                      }}
                      placeholder="Evening"
                      maxLength={40}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateLibraryCategory}
                      disabled={!libraryCategoryName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredBlockPresets.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredBlockPresets.map((preset) => {
                      const catLabels = (preset.categoryIds ?? []).map((cid) => ({
                        id: cid,
                        name: categoryMap.get(cid)?.name ?? 'Unknown',
                      }));
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className="flex flex-col rounded border px-3 py-3 text-left transition hover:border-orange-400 hover:shadow"
                          onClick={() => addBlockFromPreset(preset)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">
                              {preset.title || 'Untitled activity'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDurationLabel(preset.duration)}
                            </span>
                          </div>
                          {preset.description ? (
                            <p className="mt-1 text-xs text-gray-600">
                              {preset.description}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-gray-500">
                            {catLabels.length > 0 ? (
                              catLabels.map((label) => (
                                <span
                                  key={`${preset.id}-cat-${label.id}`}
                                  className="rounded bg-gray-100 px-2 py-0.5"
                                >
                                  {label.name}
                                </span>
                              ))
                            ) : (
                              <span className="rounded bg-gray-100 px-2 py-0.5">
                                Uncategorized
                              </span>
                            )}
                          </div>
                          <div className="mt-3 h-1 w-full rounded" style={{ background: preset.color }} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No saved timeslots yet. Save one from a block to reuse it here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {selectFlavor && selected && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/20 backdrop-blur"
          onClick={() => setSelectFlavor(false)}
        >
          <div
            className="w-96 max-h-[80vh] overflow-y-auto rounded bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-between">
              <div className="flex gap-2">
                <button
                  className={`px-2 py-1 ${flavorTab === 'flavor' ? 'border-b-2 border-black' : ''}`}
                  onClick={() => setFlavorTab('flavor')}
                >
                  Main flavor
                </button>
                <button
                  className={`px-2 py-1 ${flavorTab === 'subflavor' ? 'border-b-2 border-black' : ''}`}
                  onClick={() => setFlavorTab('subflavor')}
                >
                  Subflavor
                </button>
              </div>
              <button onClick={() => setSelectFlavor(false)}>×</button>
            </div>
            <input
              type="text"
              placeholder="Search"
              value={flavorSearch}
              onChange={(e) => setFlavorSearch(e.target.value)}
              className="mb-2 w-full rounded border p-1"
            />
            <div className="max-h-60 overflow-y-auto">
              {flavorTab === 'flavor'
                ? flavors
                    .filter((f) =>
                      f.name.toLowerCase().includes(flavorSearch.toLowerCase()),
                    )
                    .map((f) => {
                      const src = f.icon ? iconSrc(f.icon) : null;
                      const selected = tempFlavors.includes(f.id);
                      return (
                        <div
                          key={f.id}
                          className={`flex cursor-pointer items-center gap-2 rounded p-1 ${selected ? 'ring-2 ring-orange-400 bg-orange-50' : ''}`}
                          onClick={() =>
                            setTempFlavors((prev) =>
                              prev.includes(f.id)
                                ? prev.filter((id) => id !== f.id)
                                : [...prev, f.id],
                            )
                          }
                        >
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{f.icon}</span>
                          )}
                          <span>{f.name}</span>
                        </div>
                      );
                    })
                : subflavors
                    .filter((s) =>
                      s.name.toLowerCase().includes(flavorSearch.toLowerCase()),
                    )
                    .map((s) => {
                      const src = s.icon ? iconSrc(s.icon) : null;
                      const selected = tempSubs.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          className={`flex cursor-pointer items-center gap-2 rounded p-1 ${selected ? 'ring-2 ring-orange-400 bg-orange-50' : ''}`}
                          onClick={() =>
                            setTempSubs((prev) =>
                              prev.includes(s.id)
                                ? prev.filter((id) => id !== s.id)
                                : [...prev, s.id],
                            )
                          }
                        >
                          {src ? (
                            <img src={src} alt="" className="h-4 w-4" />
                          ) : (
                            <span>{s.icon}</span>
                          )}
                          <span>{s.name}</span>
                        </div>
                      );
                    })}
            </div>
            {(tempFlavors.length > 0 || tempSubs.length > 0) && (
              <div className="mt-4 text-right">
                <Button
                  onClick={() => {
                    updateBlock(selected.id, {
                      flavorIds: Array.from(
                        new Set([
                          ...(selected.flavorIds || []),
                          ...tempFlavors,
                        ]),
                      ),
                      subflavorIds: Array.from(
                        new Set([
                          ...(selected.subflavorIds || []),
                          ...tempSubs,
                        ]),
                      ),
                    });
                    setSelectFlavor(false);
                    setTempFlavors([]);
                    setTempSubs([]);
                    setFlavorSearch('');
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {aiOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/20 backdrop-blur-md">
          <div className="flex w-[90%] max-w-2xl max-h-[90vh] flex-col rounded bg-white p-6 shadow-lg">
            <div className="mb-4 flex-1 overflow-y-auto space-y-2">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === 'user' ? 'text-right' : 'text-left'}
                >
                  <span
                    className={
                      m.role === 'user'
                        ? 'inline-block rounded bg-orange-100 px-2 py-1'
                        : 'inline-block rounded bg-gray-200 px-2 py-1'
                    }
                  >
                    {m.content}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {editable && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChat();
                  }}
                  placeholder="Type your answer..."
                  className="flex-1 rounded border px-2 py-1"
                />
                <button
                  onClick={sendChat}
                  className="rounded bg-orange-500 px-3 py-1 text-white"
                >
                  Send
                </button>
              </div>
            )}
            <div className="mt-4 flex justify-between">
              {editable && (
                <button
                  type="button"
                  className="rounded border px-3 py-1"
                  onClick={resetChat}
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => setAiOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
