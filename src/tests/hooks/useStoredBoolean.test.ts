import { parseStoredBoolean } from '@/hooks/useStoredBoolean';

describe('parseStoredBoolean', () => {
  it('uses the fallback when no preference has been saved', () => {
    expect(parseStoredBoolean(null, true)).toBe(true);
    expect(parseStoredBoolean(null, false)).toBe(false);
  });

  it('restores saved boolean preferences', () => {
    expect(parseStoredBoolean('true', false)).toBe(true);
    expect(parseStoredBoolean('false', true)).toBe(false);
  });

  it('treats invalid saved values as false, matching JSON boolean parsing intent without throwing', () => {
    expect(parseStoredBoolean('invalid', true)).toBe(false);
  });
});
