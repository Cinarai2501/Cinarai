import ObjectDetailClient from '@/components/viewers/ObjectDetailClient';
import Comic2ObjectDetailClient from '@/features/comics/comic-2/components/Comic2ObjectDetailClient';
import Comic3ObjectDetailClient from '@/features/comics/comic-3/components/Comic3ObjectDetailClient';

interface ObjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comicId?: string }>;
}

export default async function Page({ params, searchParams }: ObjectPageProps) {
  const { id } = await params;
  const { comicId } = await searchParams;

  if (comicId === '2') {
    return <Comic2ObjectDetailClient id={id} />;
  }

  if (comicId === '3') {
    return <Comic3ObjectDetailClient id={id} />;
  }

  return <ObjectDetailClient id={id} />;
}
