/** A place we show weather for. Search results carry country and region so that "Kos" in Greece is never confused with another "Kos". */
export interface Place {
  name: string
  country: string
  /** First-level region, e.g. "South Aegean". */
  admin1: string
  latitude: number
  longitude: number
  /** IANA time zone; daily values are computed in this local time. */
  timezone: string
}

/** Fixed default: Kos town, Dodecanese, Greece. */
export const KOS: Place = {
  name: 'Kos',
  country: 'Greece',
  admin1: 'South Aegean',
  latitude: 36.893,
  longitude: 27.288,
  timezone: 'Europe/Athens',
}
