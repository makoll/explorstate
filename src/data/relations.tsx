const relations = {
  Europe: {
    "Northern Europe": ["GG", "JE", "AX", "DK", "EE", "FI", "FO", "GB", "IE", "IM", "IS", "LT", "LV", "NO", "SE", "SJ"],
    "Western Europe": ["AT", "BE", "CH", "DE", "DD", "FR", "FX", "LI", "LU", "MC", "NL"],
    "Eastern Europe": ["BG", "BY", "CZ", "HU", "MD", "PL", "RO", "RU", "SU", "SK", "UA"],
    "Southern Europe": [
      "AD",
      "AL",
      "BA",
      "ES",
      "GI",
      "GR",
      "HR",
      "IT",
      "ME",
      "MK",
      "MT",
      "CS",
      "RS",
      "PT",
      "SI",
      "SM",
      "VA",
      "YU",
    ],
  },
  Americas: {
    "Northern America": ["BM", "CA", "GL", "PM", "US"],
    Caribbean: [
      "AG",
      "AI",
      "AN",
      "AW",
      "BB",
      "BL",
      "BS",
      "CU",
      "DM",
      "DO",
      "GD",
      "GP",
      "HT",
      "JM",
      "KN",
      "KY",
      "LC",
      "MF",
      "MQ",
      "MS",
      "PR",
      "TC",
      "TT",
      "VC",
      "VG",
      "VI",
    ],
    "Central America": ["BZ", "CR", "GT", "HN", "MX", "NI", "PA", "SV"],
    "South America": ["AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PE", "PY", "SR", "UY", "VE"],
  },
  Asia: {
    "Central Asia": ["TM", "TJ", "KG", "KZ", "UZ"],
    "Eastern Asia": ["CN", "HK", "JP", "KP", "KR", "MN", "MO", "TW"],
    "Southern Asia": ["AF", "BD", "BT", "IN", "IR", "LK", "MV", "NP", "PK"],
    "South-Eastern Asia": ["BN", "ID", "KH", "LA", "MM", "BU", "MY", "PH", "SG", "TH", "TL", "TP", "VN"],
    "Western Asia": [
      "AE",
      "AM",
      "AZ",
      "BH",
      "CY",
      "GE",
      "IL",
      "IQ",
      "JO",
      "KW",
      "LB",
      "OM",
      "PS",
      "QA",
      "SA",
      "NT",
      "SY",
      "TR",
      "YE",
      "YD",
    ],
  },
  Africa: {
    "Northern Africa": ["DZ", "EG", "EH", "LY", "MA", "SD", "SS", "TN"],
    "Western Africa": [
      "BF",
      "BJ",
      "CI",
      "CV",
      "GH",
      "GM",
      "GN",
      "GW",
      "LR",
      "ML",
      "MR",
      "NE",
      "NG",
      "SH",
      "SL",
      "SN",
      "TG",
    ],
    "Middle Africa": ["AO", "CD", "ZR", "CF", "CG", "CM", "GA", "GQ", "ST", "TD"],
    "Eastern Africa": [
      "BI",
      "DJ",
      "ER",
      "ET",
      "KE",
      "KM",
      "MG",
      "MU",
      "MW",
      "MZ",
      "RE",
      "RW",
      "SC",
      "SO",
      "TZ",
      "UG",
      "YT",
      "ZM",
      "ZW",
    ],
    "Southern Africa": ["BW", "LS", "NA", "SZ", "ZA"],
  },
  Oceania: {
    "Australia and New Zealand": ["AU", "NF", "NZ"],
    Melanesia: ["FJ", "NC", "PG", "SB", "VU"],
    Micronesia: ["FM", "GU", "KI", "MH", "MP", "NR", "PW"],
    Polynesia: ["AS", "CK", "NU", "PF", "PN", "TK", "TO", "TV", "WF", "WS"],
  },
};
export default relations;