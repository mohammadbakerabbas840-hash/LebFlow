export type PassportAnswers = {
  route: 'application' | 'renewal' | 'lost' | 'damaged';
  ageBand: 'adult' | 'minor';
  hasPrevious: 'yes' | 'no';
};

export function validPassportAnswers(value: unknown): value is PassportAnswers {
  if (!value || typeof value !== 'object') return false;
  const a = value as PassportAnswers;
  return (
    ['application', 'renewal', 'lost', 'damaged'].includes(a.route) &&
    ['adult', 'minor'].includes(a.ageBand) &&
    ['yes', 'no'].includes(a.hasPrevious)
  );
}

/** Only the explicitly sourced minor/guardian condition changes the document list.
 * ID alternatives, photo rules and replacement exceptions still require authority review.
 */
export function passportRequirements(answers: PassportAnswers) {
  return {
    kind: answers.route === 'application' ? ('application' as const) : ('renewal' as const),
    excluded: answers.ageBand === 'adult' ? ['guardian'] : [],
    needsAuthority:
      answers.route === 'lost' ||
      answers.route === 'damaged' ||
      (answers.route === 'renewal' && answers.hasPrevious === 'no'),
  };
}
