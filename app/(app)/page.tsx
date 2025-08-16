import { CakeNavigation } from '@/components/cake/cake-navigation';
import { t } from '@/lib/i18n';

export default function DashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8">
      <h1 className="sr-only">{t('nav.cake')}</h1>
      <CakeNavigation />
    </section>
  );
}
