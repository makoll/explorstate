import { generateSecondaryRegionMap } from '@/components/pages/Top/data/Generator';
import countries from '@/data/countries';
import relations from '@/data/relations';

export type PrimaryRegionCode = string;
export type SecondaryRegionCode = string;
export type CountryCode = string;
export function isPrimaryRegionCode(arg: any): arg is PrimaryRegionCode {
  return arg != null && 'string' === typeof arg && arg in relations;
}
export function isSecondaryRegionCode(arg: any): arg is SecondaryRegionCode {
  const secondaryRegions = generateSecondaryRegionMap();
  return arg != null && 'string' === typeof arg && arg in secondaryRegions;
}
export function isCountryCode(arg: any): arg is CountryCode {
  return arg != null && 'string' === typeof arg && arg.length === 2 && arg in countries;
}
