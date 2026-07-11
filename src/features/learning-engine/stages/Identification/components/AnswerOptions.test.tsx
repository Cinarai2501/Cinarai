import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import AnswerOptions from './AnswerOptions';

test('AnswerOptions marks every selected option when multiple ids are provided', () => {
  const html = renderToStaticMarkup(
    <AnswerOptions
      options={[
        { id: 'kubus', text: 'Kubus', correct: true },
        { id: 'balok', text: 'Balok', correct: true },
        { id: 'prisma', text: 'Prisma', correct: false },
      ]}
      selectedOptionIds={['kubus', 'balok']}
      correctOptionIds={['kubus', 'balok']}
      isAnswered={false}
      onSelect={() => undefined}
    />,
  );

  assert.match(html, /Kubus/i);
  assert.match(html, /Balok/i);
  assert.match(html, /Prisma/i);
  assert.match(html, /primary-600/i);
});
