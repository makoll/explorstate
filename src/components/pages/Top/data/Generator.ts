import queryString from 'query-string';

import { AREA_CODE_WORLD } from '@/components/pages/Top';
import countries from '@/data/countries';
import relations from '@/data/relations';
import { GoogleChartsData } from '@/types/GoogleChartsData';
import { Records, compressRecords, decompressRecords } from '@/types/Records';

export const generateInitRecords = (): Records => {
  const records: Records = Object.keys(countries).reduce((obj, areaCode) => Object.assign(obj, { [areaCode]: 0 }), {});
  // 全てのエリアが0だと、デフォルトの緑色で地図が塗りつぶされるためダミーエリアのAAに1を入れる
  records['AA'] = 1;
  return records;
};

export const generateSecondaryRegionMap = () => {
  return Object.values(relations).reduce((obj, next) => Object.assign(obj, next), {});
};

export const generateSecondaryRegionPrimaryRegionMap = () => {
  const secondaryRegionPrimaryRegionMap = Object.keys(relations).reduce((o1, primaryRegion) => {
    return Object.keys(relations[primaryRegion]).reduce((o2, secondaryRegion) => {
      return Object.assign(o2, { [secondaryRegion]: primaryRegion });
    }, o1);
  }, {});
  return secondaryRegionPrimaryRegionMap;
};

export const generateCountrySecondaryRegionMap = () => {
  const countrySecondaryRegionMap = Object.keys(relations).reduce((o1, primaryRegion) => {
    return Object.keys(relations[primaryRegion]).reduce((o2, secondaryRegion) => {
      return relations[primaryRegion][secondaryRegion].reduce((o3, country) => {
        return Object.assign(o3, { [country]: secondaryRegion });
      }, o2);
    }, o1);
  }, {});
  return countrySecondaryRegionMap;
};

export const generateCountriesSubdivision = (countryCode: string, records: Records) => {
  const recordArray = Object.entries(records);
  const countriesSubdivision = recordArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
  return countriesSubdivision;
};

export const generateRecordsParameter = (records: Records): string => {
  const recordParams = compressRecords(records);
  return `records=${recordParams}`;
};

export const getParametersRecords = () => {
  const getParams = queryString.parse(location.search);
  if (!getParams.records || getParams.records instanceof Array) {
    return null;
  }
  const paramsRecords: string = getParams.records;
  const records = decompressRecords(paramsRecords);
  console.log(records);
  return records;
};

export const getParametersAreaCode = () => {
  const getParams = queryString.parse(location.search);
  if ('string' !== typeof getParams.area_code) {
    return;
  }
  return getParams.area_code;
};

export const translateGoogleChartsData = (displayingAreaCode: string, records: Records): GoogleChartsData[] => {
  const googleChartsDataNoHeader: GoogleChartsData[] = Object.entries(records).map(record => {
    const areaCode = record[0];
    const areaScore = record[1];
    const areaName = countries[areaCode][0];
    const areaNameSub = countries[areaCode][1];
    const displayAreaNameSub = areaNameSub ? ` (${areaNameSub})` : '';
    const displayAreaName = `${areaName}${displayAreaNameSub}`;
    let append = null;
    if (displayingAreaCode === AREA_CODE_WORLD || !areaCode.startsWith(displayingAreaCode)) {
      const score: number = Math.round(areaScore * 1000) / 10;
      append = `${score}%`;
    } else {
      const check = areaScore ? '☑️' : '⬛️';
      append = check;
    }
    return [areaCode, areaScore, `${displayAreaName} ${append}`];
  });
  const googleChartsData: GoogleChartsData[] = [
    ['Country', 'Value', { role: 'tooltip', p: { html: true } }],
    ...googleChartsDataNoHeader,
  ];
  return googleChartsData;
};
