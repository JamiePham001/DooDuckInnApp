/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * The active scheme, normalised to a key of `Colors`. useColorScheme() can return
 * 'light' | 'dark' | 'unspecified' | null, and indexing Colors with either of the latter
 * two hands back undefined — which makes every colour read downstream fail.
 */
export function useSchemeName(): 'light' | 'dark' {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  return Colors[useSchemeName()];
}
