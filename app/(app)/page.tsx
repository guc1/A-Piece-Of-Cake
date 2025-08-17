import { CakeNavigation } from '@/components/cake/cake-navigation';
import { t } from '@/lib/i18n';

export default function DashboardPage() {
  return (
    <section className="flex flex-1 flex-col">
      <h1 className="sr-only">{t('nav.cake')}</h1>
      <CakeNavigation />
    </section>
  );
}
