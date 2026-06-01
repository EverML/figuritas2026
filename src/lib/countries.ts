import { normalizeTextKey } from "./formatters";

export const COUNTRY_NAMES: Record<string, string> = {
  PAN: "Panamá",
  ARG: "Argentina",
  BRA: "Brasil",
  PAR: "Paraguay",
  URU: "Uruguay",
  CHI: "Chile",
  COL: "Colombia",
  ECU: "Ecuador",
  MEX: "México",
  USA: "Estados Unidos",
  CAN: "Canadá",
  CZE: "Chequia",
  SWE: "Suecia",
  TUN: "Túnez",
  BEL: "Bélgica",
  EGY: "Egipto",
  IRN: "Irán",
  NZL: "Nueva Zelanda",
  ESP: "España",
  CPV: "Cabo Verde",
  KSA: "Arabia Saudita",
  FRA: "Francia",
  SEN: "Senegal",
  IRQ: "Irak",
  NOR: "Noruega",
  ALG: "Argelia",
  AUT: "Austria",
  JOR: "Jordania",
  POR: "Portugal",
  COD: "República Democrática del Congo",
  UZB: "Uzbekistán",
  AUS: "Australia",
  TUR: "Turquía",
  GER: "Alemania",
  CUW: "Curazao",
  CIV: "Costa de Marfil",
  NED: "Países Bajos",
  JPN: "Japón",
  HAI: "Haití",
  QAT: "Catar",
  SUI: "Suiza",
  BRAZIL: "Brasil",
  RSA: "Sudáfrica",
  KOR: "Corea",
  BIH: "Bosnia",
  MAR: "Marruecos",
  PARAGUAY: "Paraguay",
  SCO: "Escocia",
};

export const COUNTRY_ALIASES: Record<string, string> = {
  panama: "PAN",
  panamá: "PAN",
  mexico: "MEX",
  méxico: "MEX",
  sudafrica: "RSA",
  sudáfrica: "RSA",
  corea: "KOR",
  canada: "CAN",
  canadá: "CAN",
  bosnia: "BIH",
  qatar: "QAT",
  suiza: "SUI",
  brasil: "BRA",
  morocco: "MAR",
  marruecos: "MAR",
  haiti: "HAI",
  haití: "HAI",
  ecuador: "ECU",
  japon: "JPN",
  japón: "JPN",
  sue: "SWE",
  swe: "SWE",
  py: "PAR",
  paraguay: "PAR",
  estadosunidos: "USA",
  "estados unidos": "USA",
  "republica checa": "CZE",
  "república checa": "CZE",
  "nueva zelanda": "NZL",
  "costa de marfil": "CIV",
  "arabia saudita": "KSA",
  "republica democratica del congo": "COD",
  "república democrática del congo": "COD",
  "paises bajos": "NED",
  "países bajos": "NED",
  "cabo verde": "CPV",
  "corea del sur": "KOR",
};

export function resolveCountryCode(rawValue: string): string | undefined {
  const normalized = normalizeTextKey(rawValue);

  if (COUNTRY_NAMES[rawValue.toUpperCase()]) {
    return rawValue.toUpperCase();
  }

  if (COUNTRY_NAMES[normalized.toUpperCase()]) {
    return normalized.toUpperCase();
  }

  return COUNTRY_ALIASES[normalized] ?? COUNTRY_ALIASES[normalized.replace(/\s+/g, "")];
}

export function resolveCountryName(codeOrName: string): string {
  if (!codeOrName) {
    return "";
  }

  const code = codeOrName.toUpperCase();
  return COUNTRY_NAMES[code] ?? titleCaseFallback(codeOrName);
}

function titleCaseFallback(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
