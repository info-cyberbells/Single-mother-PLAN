import { BadRequestError } from '../utils/errors';

const ZIPPOTAM_BASE_URL = 'https://api.zippopotam.us/us';

export function isZipValidationEnabled(): boolean {
  return true;
}

export type ZipValidationErrorCode =
  | 'INVALID_FORMAT'
  | 'NOT_FOUND'
  | 'STATE_MISMATCH'
  | 'CITY_MISMATCH'
  | 'NETWORK_ERROR';

export interface ZipValidationResult {
  valid: boolean;
  city?: string;
  state?: string;
  zip?: string;
  cities?: string[];
  error?: string;
  errorCode?: ZipValidationErrorCode;
}

export interface ZipLookupResult {
  zip: string;
  state: string | null;
  cities: string[];
  error?: string;
  errorCode?: ZipValidationErrorCode;
}

export interface CityLookupResult {
  valid: boolean;
  city: string | null;
  state: string | null;
  zips: string[];
  error?: string;
  errorCode?: ZipValidationErrorCode;
}

interface ZippopotamPlace {
  'place name': string;
  state: string;
  'state abbreviation': string;
  'post code'?: string;
}

interface ZippopotamResponse {
  'post code': string;
  country: string;
  places: ZippopotamPlace[];
}

export function extractZip5(zip: string): string | null {
  const match = zip.trim().match(/^(\d{5})(?:-\d{4})?$/);
  return match ? match[1] : null;
}

export function isValidZipFormat(zip: string): boolean {
  return extractZip5(zip) !== null;
}

function normalizeState(state: string): string {
  return state.trim().toUpperCase();
}

export function normalizeCityName(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, ' ');
}

function citiesMatch(a: string, b: string): boolean {
  return normalizeCityName(a) === normalizeCityName(b);
}

function formatCitySlug(city: string): string {
  return encodeURIComponent(city.trim().toLowerCase());
}

function formatCityMismatchError(
  zip5: string,
  state: string,
  selectedCity: string,
  zipCities: string[]
): string {
  const canonical = zipCities.join(' or ');
  return `ZIP ${zip5} is assigned to ${canonical}, ${state} — not ${selectedCity}.`;
}

export class ZipValidationService {
  async fetchZipData(zip5: string): Promise<ZippopotamResponse> {
    const response = await fetch(`${ZIPPOTAM_BASE_URL}/${zip5}`, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) {
      throw Object.assign(new Error('ZIP not found'), { code: 'NOT_FOUND' as const });
    }

    if (!response.ok) {
      throw Object.assign(new Error(`ZIP lookup failed (${response.status})`), {
        code: 'NETWORK_ERROR' as const,
      });
    }

    return (await response.json()) as ZippopotamResponse;
  }

  resolvePlaceForState(data: ZippopotamResponse, state: string): ZippopotamPlace | null {
    const normalizedState = normalizeState(state);
    return (
      data.places.find((place) => normalizeState(place['state abbreviation']) === normalizedState) ??
      null
    );
  }

  resolvePlacesForStateAndCity(
    data: ZippopotamResponse,
    state: string,
    city?: string
  ): ZippopotamPlace[] {
    const normalizedState = normalizeState(state);
    const statePlaces = data.places.filter(
      (place) => normalizeState(place['state abbreviation']) === normalizedState
    );
    if (!city?.trim()) return statePlaces;
    return statePlaces.filter((place) => citiesMatch(place['place name'], city));
  }

  uniqueCities(places: ZippopotamPlace[]): string[] {
    return [...new Set(places.map((place) => place['place name']))].sort((a, b) =>
      a.localeCompare(b)
    );
  }

  async lookupCityInState(state: string, city: string): Promise<CityLookupResult> {
    const normalizedState = normalizeState(state);
    const trimmedCity = city?.trim();

    if (!normalizedState || normalizedState.length !== 2) {
      return {
        valid: false,
        city: null,
        state: null,
        zips: [],
        error: 'Please select a valid US state.',
        errorCode: 'INVALID_FORMAT',
      };
    }

    if (!trimmedCity) {
      return {
        valid: false,
        city: null,
        state: null,
        zips: [],
        error: 'City is required.',
        errorCode: 'INVALID_FORMAT',
      };
    }

    try {
      const response = await fetch(
        `${ZIPPOTAM_BASE_URL}/${normalizedState.toLowerCase()}/${formatCitySlug(trimmedCity)}`,
        { headers: { Accept: 'application/json' } }
      );

      if (response.status === 404) {
        return {
          valid: false,
          city: null,
          state: normalizedState,
          zips: [],
          error: `Could not find ${trimmedCity} in ${normalizedState}.`,
          errorCode: 'NOT_FOUND',
        };
      }

      if (!response.ok) {
        return {
          valid: false,
          city: null,
          state: normalizedState,
          zips: [],
          error: 'Unable to verify city right now. Please try again.',
          errorCode: 'NETWORK_ERROR',
        };
      }

      const data = (await response.json()) as ZippopotamResponse & { 'place name'?: string };
      const canonicalCity = data['place name'] ?? data.places[0]?.['place name'] ?? trimmedCity;
      const zips = [
        ...new Set(
          data.places
            .map((place) => extractZip5(place['post code'] ?? ''))
            .filter((zip): zip is string => Boolean(zip))
        ),
      ].sort();

      return {
        valid: true,
        city: canonicalCity,
        state: normalizedState,
        zips,
      };
    } catch {
      return {
        valid: false,
        city: null,
        state: normalizedState,
        zips: [],
        error: 'Unable to verify city right now. Please try again.',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  async lookupZip(zip: string): Promise<ZipLookupResult> {
    if (!isZipValidationEnabled()) {
      const zip5 = extractZip5(zip);
      return { zip: zip5 ?? '', state: null, cities: [] };
    }

    const zip5 = extractZip5(zip);
    if (!zip5) {
      return {
        zip: '',
        state: null,
        cities: [],
        error: 'Please enter a valid US ZIP code.',
        errorCode: 'INVALID_FORMAT',
      };
    }

    try {
      const data = await this.fetchZipData(zip5);
      const states = [
        ...new Set(data.places.map((place) => normalizeState(place['state abbreviation']))),
      ];
      const cities = this.uniqueCities(data.places);

      if (states.length === 0) {
        return {
          zip: zip5,
          state: null,
          cities: [],
          error: 'ZIP code could not be verified.',
          errorCode: 'NOT_FOUND',
        };
      }

      return {
        zip: zip5,
        state: states.length === 1 ? states[0] : null,
        cities,
      };
    } catch (error: any) {
      if (error?.code === 'NOT_FOUND') {
        return {
          zip: zip5,
          state: null,
          cities: [],
          error: 'ZIP code could not be verified.',
          errorCode: 'NOT_FOUND',
        };
      }

      return {
        zip: zip5,
        state: null,
        cities: [],
        error: 'Unable to verify ZIP code right now. Please try again.',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  async validateZip(zip: string, state: string, city?: string): Promise<ZipValidationResult> {
    if (!isZipValidationEnabled()) {
      const zip5 = extractZip5(zip);
      return {
        valid: true,
        zip: zip5 ?? undefined,
        state: state ? normalizeState(state) : undefined,
      };
    }

    const zip5 = extractZip5(zip);
    if (!zip5) {
      return {
        valid: false,
        error: 'Please enter a valid US ZIP code.',
        errorCode: 'INVALID_FORMAT',
      };
    }

    const normalizedState = normalizeState(state);
    if (!normalizedState || normalizedState.length !== 2) {
      return {
        valid: false,
        error: 'Please select a valid US state.',
        errorCode: 'INVALID_FORMAT',
      };
    }

    try {
      const data = await this.fetchZipData(zip5);
      const statePlaces = data.places.filter(
        (place) => normalizeState(place['state abbreviation']) === normalizedState
      );

      if (statePlaces.length === 0) {
        return {
          valid: false,
          zip: zip5,
          error: 'This ZIP code does not belong to the selected state.',
          errorCode: 'STATE_MISMATCH',
        };
      }

      const cities = this.uniqueCities(statePlaces);
      const trimmedCity = city?.trim();

      if (trimmedCity) {
        const matchingPlaces = this.resolvePlacesForStateAndCity(data, normalizedState, trimmedCity);
        if (matchingPlaces.length > 0) {
          return {
            valid: true,
            city: matchingPlaces[0]['place name'],
            state: matchingPlaces[0]['state abbreviation'],
            zip: zip5,
            cities,
          };
        }

        const cityLookup = await this.lookupCityInState(normalizedState, trimmedCity);
        if (cityLookup.valid && cityLookup.zips.includes(zip5)) {
          return {
            valid: true,
            city: cityLookup.city ?? trimmedCity,
            state: normalizedState,
            zip: zip5,
            cities,
          };
        }

        return {
          valid: false,
          zip: zip5,
          cities,
          error: formatCityMismatchError(zip5, normalizedState, trimmedCity, cities),
          errorCode: 'CITY_MISMATCH',
        };
      }

      const place = statePlaces[0];
      return {
        valid: true,
        city: place['place name'],
        state: place['state abbreviation'],
        zip: zip5,
        cities,
      };
    } catch (error: any) {
      if (error?.code === 'NOT_FOUND') {
        return {
          valid: false,
          zip: zip5,
          error: 'ZIP code could not be verified.',
          errorCode: 'NOT_FOUND',
        };
      }

      return {
        valid: false,
        zip: zip5,
        error: 'Unable to verify ZIP code right now. Please try again.',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  async assertZipValid(zip: string, state: string, city?: string): Promise<ZipValidationResult> {
    const result = await this.validateZip(zip, state, city);
    if (!result.valid) {
      throw new BadRequestError(result.error || 'Invalid ZIP code.');
    }
    return result;
  }

  /** Resolve canonical state and city from a ZIP code (single source of truth). */
  async resolveLocationFromZip(zip: string): Promise<{
    zip_code: string;
    state: string;
    city: string;
  }> {
    const lookup = await this.lookupZip(zip);
    if (!lookup.state) {
      throw new BadRequestError(lookup.error || 'Invalid ZIP code.');
    }

    const validation = await this.validateZip(zip, lookup.state);
    if (!validation.valid || !validation.state || !validation.city) {
      throw new BadRequestError(validation.error || 'Invalid ZIP code.');
    }

    return {
      zip_code: validation.zip ?? lookup.zip,
      state: validation.state,
      city: validation.city,
    };
  }
}

export const zipValidationService = new ZipValidationService();
