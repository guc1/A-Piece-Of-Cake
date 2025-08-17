import { CakeNavigation } from '@/components/cake/cake-navigation';
import { t } from '@/lib/i18n';

export default function DashboardPage() {
  return (
    <section className="w-full">
      <h1 className="sr-only">{t('nav.cake')}</h1>
      <CakeNavigation />
    </section>
  );
}
