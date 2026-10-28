import { object, text, list, attachment, HttpError } from './security.mjs';
export function validate(body) {
  object(body, ['operation', 'input']);
  const { operation, input } = body;
  let cost = 1;

  if (operation !== 'coach') throw new HttpError(400, 'Unsupported AI operation.');
  object(input, ['message', 'context']);
  text(input.message, 4000); text(input.context, 12000, true);

  return { operation, input, cost, stream: operation === 'chat' };
}
