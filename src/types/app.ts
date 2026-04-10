// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Kategorien {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    farbe?: LookupValue;
  };
}

export interface Kontakte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    firma?: string;
    kategorie?: string; // applookup -> URL zu 'Kategorien' Record
    notiz?: string;
  };
}

export const APP_IDS = {
  KATEGORIEN: '69d8acd057d46e9b115574a9',
  KONTAKTE: '69d8acd3f729704245583814',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'kategorien': {
    farbe: [{ key: "rot", label: "Rot" }, { key: "blau", label: "Blau" }, { key: "gruen", label: "Grün" }, { key: "gelb", label: "Gelb" }, { key: "orange", label: "Orange" }, { key: "lila", label: "Lila" }, { key: "grau", label: "Grau" }, { key: "schwarz", label: "Schwarz" }, { key: "weiss", label: "Weiß" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kategorien': {
    'name': 'string/text',
    'farbe': 'lookup/select',
  },
  'kontakte': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'firma': 'string/text',
    'kategorie': 'applookup/select',
    'notiz': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKategorien = StripLookup<Kategorien['fields']>;
export type CreateKontakte = StripLookup<Kontakte['fields']>;