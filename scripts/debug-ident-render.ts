import { createIdentificationState } from '../src/features/learning-engine/stages/Identification/services/identificationService';

function run() {
  const comicId = 2;
  const lokasi = 'Candi Penataran, Blitar';
  const learningTargets: readonly string[] = [];
  const cover = '/comics/komik-2/cover.png';
  const title = 'Petualangan Simetri Candi Penataran';
  const comicSlug = 'komik-2';
  const sourcePage = 1;
  const pdfPath = null;

  const state = createIdentificationState(comicId, lokasi, learningTargets, cover, title, comicSlug, sourcePage, pdfPath);

  const firstItem = state.items[0];

  console.log('---- Identification State Snapshot ----');
  console.log('package.id:', comicId);
  console.log('item.question:', firstItem.question);
  console.log('renderedQuestion (component would render):', firstItem.question);
  console.log('all options:', firstItem.options.map(o => ({ id: o.id, text: o.text, correct: o.correct })));
  console.log('image:', firstItem.image);
  console.log('--- JSON item ---');
  console.log(JSON.stringify(firstItem, null, 2));
}

run();
