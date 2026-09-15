/**
 * Aggregation and reporting functions for Lead entities
 * Computes totals, averages, min/max, and grouped counts
 */

import {
  Lead,
  MonthlyReport,
  LeadStatistics,
  AggregatedMetric,
  Country,
  ProductType,
  MonthlyVolume,
  ServiceType,
  LeadStatus
} from './types';

// ──────────────────────────────────────────────
// 1. Basic Aggregations
// ──────────────────────────────────────────────

/** Count total leads */
export function countLeads(leads: ReadonlyArray<Lead>): number {
  return leads.length;
}

/** Get leads by status */
export function getLeadsByStatus(leads: ReadonlyArray<Lead>): Record<LeadStatus, number> {
  return leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);
}

/** Get leads by country */
export function getLeadsByCountry(leads: ReadonlyArray<Lead>): Record<Country, number> {
  return leads.reduce((acc, lead) => {
    acc[lead.company.country] = (acc[lead.company.country] || 0) + 1;
    return acc;
  }, {} as Record<Country, number>);
}

/** Get leads by product type */
export function getLeadsByProductType(leads: ReadonlyArray<Lead>): Record<ProductType, number> {
  return leads.reduce((acc, lead) => {
    acc[lead.company.productType] = (acc[lead.company.productType] || 0) + 1;
    return acc;
  }, {} as Record<ProductType, number>);
}

/** Get leads by service type */
export function getLeadsByServiceType(leads: ReadonlyArray<Lead>): Record<ServiceType, number> {
  return leads.reduce((acc, lead) => {
    lead.company.services.forEach(service => {
      acc[service] = (acc[service] || 0) + 1;
    });
    return acc;
  }, {} as Record<ServiceType, number>);
}

/** Get leads by monthly volume */
export function getLeadsByMonthlyVolume(leads: ReadonlyArray<Lead>): Record<MonthlyVolume, number> {
  return leads.reduce((acc, lead) => {
    acc[lead.company.monthlyVolume] = (acc[lead.company.monthlyVolume] || 0) + 1;
    return acc;
  }, {} as Record<MonthlyVolume, number>);
}

// ──────────────────────────────────────────────
// 2. Advanced Aggregations
// ──────────────────────────────────────────────

/** Calculate average processing time */
export function calculateAverageProcessingTime(leads: ReadonlyArray<Lead>): number {
  const processedLeads = leads.filter(lead => lead.processedAt);
  if (processedLeads.length === 0) return 0;

  const totalTime = processedLeads.reduce((sum, lead) => {
    const timeDiff = lead.processedAt!.getTime() - lead.createdAt.getTime();
    return sum + timeDiff;
  }, 0);

  return totalTime / processedLeads.length;
}

/** Calculate conversion rate */
export function calculateConversionRate(leads: ReadonlyArray<Lead>): number {
  if (leads.length === 0) return 0;
  const converted = leads.filter(lead => lead.status === 'convertido').length;
  return converted / leads.length;
}

/** Calculate average monthly volume (numerical) */
export function calculateAverageMonthlyVolume(leads: ReadonlyArray<Lead>): number {
  const volumeMap: Record<MonthlyVolume, number> = {
    '0-100': 50,
    '101-500': 300,
    '501-2000': 1250,
    '2000+': 3000,
    'No estoy seguro': 0
  };

  const volumes = leads
    .filter(lead => lead.company.monthlyVolume !== 'No estoy seguro')
    .map(lead => volumeMap[lead.company.monthlyVolume]);

  if (volumes.length === 0) return 0;
  return volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
}

// ──────────────────────────────────────────────
// 3. Grouped Aggregations
// ──────────────────────────────────────────────

/** Group leads by a field and compute metrics */
export function aggregateByField<T extends keyof Lead['company']>(
  leads: ReadonlyArray<Lead>,
  field: T,
  metricFn: (items: Lead[]) => number = (items) => items.length
): AggregatedMetric<Lead>[] {
  const groups = new Map<string, Lead[]>();

  leads.forEach(lead => {
    const key = String(lead.company[field]);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(lead);
  });

  return Array.from(groups.entries()).map(([key, items]) => {
    const values = items.map(item => metricFn([item]));
    const total = values.reduce((sum, v) => sum + v, 0);

    return {
      key,
      count: items.length,
      total,
      average: items.length > 0 ? total / items.length : 0,
      min: Math.min(...values),
      max: Math.max(...values),
      items
    };
  });
}

/** Aggregate leads by country with all metrics */
export function aggregateByCountry(leads: ReadonlyArray<Lead>): AggregatedMetric<Lead>[] {
  return aggregateByField(leads, 'country');
}

/** Aggregate leads by product type with all metrics */
export function aggregateByProductType(leads: ReadonlyArray<Lead>): AggregatedMetric<Lead>[] {
  return aggregateByField(leads, 'productType');
}

/** Aggregate leads by service type */
export function aggregateByServiceType(leads: ReadonlyArray<Lead>): AggregatedMetric<Lead>[] {
  const serviceGroups = new Map<string, Lead[]>();

  leads.forEach(lead => {
    lead.company.services.forEach(service => {
      if (!serviceGroups.has(service)) {
        serviceGroups.set(service, []);
      }
      serviceGroups.get(service)!.push(lead);
    });
  });

  return Array.from(serviceGroups.entries()).map(([key, items]) => {
    const values = items.map(() => 1);
    const total = values.reduce((sum, v) => sum + v, 0);

    return {
      key,
      count: items.length,
      total,
      average: items.length > 0 ? total / items.length : 0,
      min: Math.min(...values),
      max: Math.max(...values),
      items
    };
  });
}

// ──────────────────────────────────────────────
// 4. Report Generation
// ──────────────────────────────────────────────

/** Generate monthly report */
export function generateMonthlyReport(
  leads: ReadonlyArray<Lead>,
  month: string,
  year: number
): MonthlyReport {
  const leadsByCountry = getLeadsByCountry(leads);
  const leadsByProductType = getLeadsByProductType(leads);
  const averageVolume = calculateAverageMonthlyVolume(leads);
  const conversionRate = calculateConversionRate(leads);

  return {
    month,
    year,
    totalLeads: leads.length,
    leadsByCountry,
    leadsByProductType,
    averageVolume,
    conversionRate
  };
}

/** Generate lead statistics */
export function calculateLeadStatistics(leads: ReadonlyArray<Lead>): LeadStatistics {
  const leadsByService = getLeadsByServiceType(leads);
  const leadsByVolume = getLeadsByMonthlyVolume(leads);

  const countryCounts = getLeadsByCountry(leads);
  const topCountries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([country]) => country as Country);

  const averageProcessingTime = calculateAverageProcessingTime(leads);

  return {
    totalLeads: leads.length,
    leadsByService,
    leadsByVolume,
    topCountries,
    averageProcessingTime
  };
}

// ──────────────────────────────────────────────
// 5. Utility Aggregations
// ──────────────────────────────────────────────

/** Get top N leads by a metric */
export function getTopLeadsByMetric(
  leads: ReadonlyArray<Lead>,
  metric: (lead: Lead) => number,
  n: number
): Lead[] {
  return [...leads].sort((a, b) => metric(b) - metric(a)).slice(0, n);
}

/** Get leads with most services */
export function getLeadsWithMostServices(leads: ReadonlyArray<Lead>, n: number): Lead[] {
  return getTopLeadsByMetric(leads, (lead) => lead.company.services.length, n);
}

/** Calculate percentiles for a numeric field */
export function calculatePercentile(
  leads: ReadonlyArray<Lead>,
  percentile: number,
  getValue: (lead: Lead) => number
): number {
  const values = leads.map(getValue).sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  return values[Math.max(0, index)] ?? 0;
}

/** Get summary statistics for a numeric field */
export function getNumericStats(
  leads: ReadonlyArray<Lead>,
  getValue: (lead: Lead) => number
): {
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  median: number;
  p25: number;
  p75: number;
} {
  const values = leads.map(getValue).sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((s, v) => s + v, 0);
  const average = count > 0 ? sum / count : 0;
  const min = count > 0 ? values[0]! : 0;
  const max = count > 0 ? values[values.length - 1]! : 0;
  const median = calculatePercentile(leads, 50, getValue);
  const p25 = calculatePercentile(leads, 25, getValue);
  const p75 = calculatePercentile(leads, 75, getValue);

  return { count, sum, average, min, max, median, p25, p75 };
}