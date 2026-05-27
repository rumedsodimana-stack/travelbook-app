/**
 * Fixture corpus shape.
 *
 * Each fixture is an "offer menu" — the structural what (carrier, route, hotel
 * name, activity venue) with time-of-day patterns. The AI build pipeline picks
 * items from the menu and instantiates them with concrete timestamps in the
 * user's trip window.
 */

export type Tag =
  | "DIRECT"
  | "CHEAPER"
  | "EARLIER"
  | "LATER"
  | "DAYTIME"
  | "RED-EYE"
  | "SAME AIRLINE"
  | "LUXURY"
  | "MID"
  | "LEAN"
  | "CULTURAL"
  | "FOOD"
  | "SLOW"
  | "ADVENTURE"
  | "WELLNESS"
  | "FAMILY-OK";

export interface FlightOffer {
  from: string; // IATA
  to: string; // IATA
  carrier: string;
  flightNo: string;
  depTimeLocal: string; // HH:mm
  arrTimeLocal: string; // HH:mm
  durationMin: number;
  stops: string[]; // IATA codes
  fare: "economy" | "premium" | "business" | "first";
  aircraft: string;
  meals: boolean;
  wifi: boolean;
  priceUSD: number;
  tags: Tag[];
}

export interface StayOffer {
  name: string;
  address: string;
  nightlyUSD: number;
  view?: string;
  rating: number; // 1–5
  tags: Tag[];
}

export interface ActivityOffer {
  name: string;
  venue: string;
  durationMin: number;
  startsTimeLocal: string; // HH:mm preferred slot
  priceUSD: number; // per person
  category: "culture" | "food" | "outdoors" | "wellness" | "nightlife";
  tags: Tag[];
}

export interface TransitOffer {
  carrier: string;
  service: string;
  fromStation: string;
  toStation: string;
  depTimeLocal: string;
  arrTimeLocal: string;
  durationMin: number;
  priceUSD: number;
  tags: Tag[];
}

export interface DiningOffer {
  name: string;
  cuisine: string;
  venue: string;
  startsTimeLocal: string;
  durationMin: number;
  pricePerPersonUSD: number;
  tags: Tag[];
}

export interface VisaOffer {
  country: string; // ISO-3166 alpha-2
  type: "tourist" | "business" | "transit";
  validityDays: number;
  evisa: boolean;
  priceUSD: number;
}

export interface InsuranceOffer {
  carrier: string;
  tier: string;
  coverage: string;
  priceUSDPerDay: number;
  tags: Tag[];
}

export interface DestinationFixture {
  destinationCode: string; // ISO country or city slug
  name: string;
  airports: string[]; // IATA codes
  flights: FlightOffer[];
  stays: StayOffer[];
  activities: ActivityOffer[];
  transit: TransitOffer[];
  dining: DiningOffer[];
  visa: VisaOffer[];
  insurance: InsuranceOffer[];
}
