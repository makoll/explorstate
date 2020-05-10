import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export type Records = {
  [key: string]: number;
};

export const compressRecords = (records: Records): string => {
  const visitedSubdivisionCodes = Object.keys(records).filter(subdivisionCode => {
    return subdivisionCode.length !== 2 && records[subdivisionCode] === 1;
  });
  // {countryCode: [subdivisionCode]}のフォーマットに
  // subdivisionCodeからはcountryCodeを除く
  type UrlRecordData = { [index: string]: string[] };
  const changedFormatBase: UrlRecordData = {};
  const changedFormat = visitedSubdivisionCodes.reduce((o: { [key: string]: string[] }, subdivisionCode) => {
    const splitedSubdivisionCode = subdivisionCode.split('-');
    const countryCode = splitedSubdivisionCode[0];
    const existed = countryCode in o ? o[countryCode] : [];
    existed.push(splitedSubdivisionCode[1]);
    return Object.assign(o, { [countryCode]: existed });
  }, changedFormatBase);

  // countryCode(CC),subdivisionCode(SC)を、CC:SC,SC;CC:SC,SC;...のフォーマットの文字列に変換
  let formatted = Object.keys(changedFormat).reduce((s, countryCode) => {
    const countriesFormatted = `${countryCode}:${changedFormat[countryCode].join(',')};`;
    return `${s}${countriesFormatted}`;
  }, '');
  formatted = formatted.replace(/;$/g, '');

  const compressed = compressToEncodedURIComponent(formatted);
  return compressed;
};

export const decompressRecords = (compressed: string): Records => {
  const recordsString = decompressFromEncodedURIComponent(compressed) || '';
  const countryDataArray = recordsString.split(';');
  const records = countryDataArray.reduce((o: Records, c) => {
    const splittedCompnayAndSubdivision = c.split(':');
    const countryCode = splittedCompnayAndSubdivision[0];
    const subdivisionCodesWithoutCountryCode = splittedCompnayAndSubdivision[1].split(',');
    const subdivisionRecords = subdivisionCodesWithoutCountryCode.reduce(
      (tmpSubdivisonRecords, subdivisionCodeWithoutCountryCode) => {
        return Object.assign(tmpSubdivisonRecords, { [`${countryCode}-${subdivisionCodeWithoutCountryCode}`]: 1 });
      },
      {},
    );
    return Object.assign(o, subdivisionRecords);
  }, {});
  return records;
};
