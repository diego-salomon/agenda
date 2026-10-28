/**
 * A bookable service. The catalog lives in agenda.config.ts, not in the
 * domain — this is just the shape the domain and UI agree on.
 */
export interface Service {
  id: string;
  name: string;
  summary: string;
  description: string;
  benefits: string[];
  durationMinutes: number;
  price: number;
  imageUrl: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
}
