'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function viewAccount(viewId: number) {
  const store = await cookies();
  store.set('viewId', String(viewId));
  redirect('/');
}

export async function exitViewing() {
  const store = await cookies();
  store.delete('viewId');
  redirect('/');
}

