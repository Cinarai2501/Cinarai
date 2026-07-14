import ObjectDetailClient from '@/components/viewers/ObjectDetailClient';

interface ObjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: ObjectPageProps) {
  const { id } = await params;
  return <ObjectDetailClient id={id} />;
}
