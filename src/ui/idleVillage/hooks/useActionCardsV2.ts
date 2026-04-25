// Flag per controllare l'uso dei nuovi wrapper
const USE_ACTIONCARDS_V2 = import.meta.env.VILLAGE_ACTIONCARDS_V2 === 'true';

/**
 * Helper per verificare se i wrapper V2 sono abilitati
 */
export const useActionCardsV2 = (): boolean => {
  return USE_ACTIONCARDS_V2;
};
