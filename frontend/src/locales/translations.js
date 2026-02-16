/**
 * Translation helper functions to concatenate words into sentences
 * All translations use single words only - no compound words
 */

/**
 * Concatenate words with spaces
 */
export function concat(...words) {
    return words.filter(Boolean).join(' ');
}

/**
 * Helper to build custom sentences from single word translations
 * Usage: buildSentence(t, 'add', 'user') => "Add User"
 */
export function buildSentence(t, ...keys) {
    return concat(...keys.map(key => t(key)));
}
