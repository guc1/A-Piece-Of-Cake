import FlavorsClient from './client';

export function FlavorsHome({
  userId,
  selfId,
  initialFlavors,
  people,
  headingReport,
}: {
  userId: string;
  selfId?: string;
  initialFlavors: any[];
  people?: any;
  headingReport?: any;
}) {
  return (
    <FlavorsClient
      userId={userId}
      selfId={selfId}
      initialFlavors={initialFlavors as any}
      people={people as any}
      headingReport={headingReport}
    />
  );
}
