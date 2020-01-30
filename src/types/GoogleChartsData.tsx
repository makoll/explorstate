export type GoogleChartsHeader = [string, string, { role: string; p: { html: boolean } }];
export type GoogleChartsData = GoogleChartsHeader | [string, number, string];
