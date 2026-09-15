/**
 * Data transformations and reporting utilities
 * Functions for aggregations, statistics, and report generation
 */

import {
  LeadFormData,
  MonthlyReport,
  LeadStatistics,
  Country,
  ProductType,
  MonthlyVolume,
  ServiceType
} from '../types/models';
import { groupBy, countBy, sum, average } from './collections';

/**
 * Generate monthly report from lead data
 */
export function generateMonthlyReport(
  leads: LeadFormData[],
  month: string,
  year: number
): MonthlyReport {
  const leadsByCountry = countBy(leads, lead => lead.country) as Record<Country, number>;
  const leadsByProductType = countBy(leads, lead => lead.productType) as Record<ProductType, number>;
  
  // Calculate average volume (convert ranges to midpoints)
  const volumeMidpoints: Record<MonthlyVolume, number> = {
    '0-100': 50,
    '101-500': 300,
    '501-2000': 1250,
    '2000+': 3000,
    'no-estoy-seguro': 0
  };
  
  const volumes = leads
    .filter(lead => lead.monthlyVolume !== 'no-estoy-seguro')
    .map(lead => volumeMidpoints[lead.monthlyVolume]);
  
  const averageVolume = volumes.length > 0 ? average(volumes) : 0;
  
  // Conversion rate (placeholder - would need actual conversion data)
  const conversionRate = 0.15; // 15% placeholder
  
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

/**
 * Calculate lead statistics
 */
export function calculateLeadStatistics(leads: LeadFormData[]): LeadStatistics {
  const leadsByService = leads.reduce((acc, lead) => {
    lead.services.forEach(service => {
      acc[service] = (acc[service] || 0) + 1;
    });
    return acc;
  }, {} as Record<ServiceType, number>);
  
  const leadsByVolume = countBy(leads, lead => lead.monthlyVolume) as Record<MonthlyVolume, number>;
  
  // Get top countries by lead count
  const countryCounts = countBy(leads, lead => lead.country);
  const topCountries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([country]) => country as Country);
  
  // Placeholder for average processing time
  const averageProcessingTime = 2.5; // hours
  
  return {
    totalLeads: leads.length,
    leadsByService,
    leadsByVolume,
    topCountries,
    averageProcessingTime
  };
}

/**
 * Transform lead data for visualization
 */
export function transformForChart(
  leads: LeadFormData[],
  groupByField: keyof LeadFormData,
  valueField?: keyof LeadFormData
): Array<{ name: string; value: number }> {
  const grouped = groupBy(leads, lead => String(lead[groupByField]));
  
  return Object.entries(grouped).map(([name, items]) => ({
    name,
    value: valueField
      ? sum(items.map(item => Number(item[valueField]) || 0))
      : items.length
  }));
}

/**
 * Calculate conversion funnel metrics
 */
export function calculateConversionFunnel(leads: LeadFormData[]): {
  totalLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  conversionRate: number;
} {
  const totalLeads = leads.length;
  
  // Qualification criteria: has email, phone, and selected at least one service
  const qualifiedLeads = leads.filter(
    lead => lead.email && lead.phone && lead.services.length > 0
  ).length;
  
  // Placeholder for contacted and converted leads
  const contactedLeads = Math.floor(qualifiedLeads * 0.6);
  const convertedLeads = Math.floor(contactedLeads * 0.25);
  
  const conversionRate = totalLeads > 0 ? convertedLeads / totalLeads : 0;
  
  return {
    totalLeads,
    qualifiedLeads,
    contactedLeads,
    convertedLeads,
    conversionRate
  };
}

/**
 * Generate geographic distribution report
 */
export function generateGeographicReport(leads: LeadFormData[]): Array<{
  country: Country;
  totalLeads: number;
  percentage: number;
  topProducts: ProductType[];
  averageVolume: number;
}> {
  const totalLeads = leads.length;
  const groupedByCountry = groupBy(leads, lead => lead.country);
  
  return Object.entries(groupedByCountry).map(([country, countryLeads]) => {
    const productCounts = countBy(countryLeads, lead => lead.productType);
    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([product]) => product as ProductType);
    
    // Calculate average volume for country
    const volumeMidpoints: Record<MonthlyVolume, number> = {
      '0-100': 50,
      '101-500': 300,
      '501-2000': 1250,
      '2000+': 3000,
      'no-estoy-seguro': 0
    };
    
    const volumes = countryLeads
      .filter(lead => lead.monthlyVolume !== 'no-estoy-seguro')
      .map(lead => volumeMidpoints[lead.monthlyVolume]);
    
    const averageVolume = volumes.length > 0 ? average(volumes) : 0;
    
    return {
      country: country as Country,
      totalLeads: countryLeads.length,
      percentage: totalLeads > 0 ? countryLeads.length / totalLeads : 0,
      topProducts,
      averageVolume
    };
  });
}

/**
 * Generate service popularity report
 */
export function generateServiceReport(leads: LeadFormData[]): Array<{
  service: ServiceType;
  totalLeads: number;
  percentage: number;
  averageCommentsLength: number;
}> {
  const totalLeads = leads.length;
  
  const serviceTypes: ServiceType[] = ['almacenaje', 'ultima-milla', 'logistica-inversa'];
  
  return serviceTypes.map(service => {
    const serviceLeads = leads.filter(lead => lead.services.includes(service));
    const commentsLengths = serviceLeads
      .filter(lead => lead.comments)
      .map(lead => lead.comments!.length);
    
    return {
      service,
      totalLeads: serviceLeads.length,
      percentage: totalLeads > 0 ? serviceLeads.length / totalLeads : 0,
      averageCommentsLength: commentsLengths.length > 0 ? average(commentsLengths) : 0
    };
  });
}

/**
 * Aggregate data by time period
 */
export function aggregateByTimePeriod<T>(
  data: T[],
  dateField: keyof T,
  period: 'day' | 'week' | 'month' | 'year'
): Record<string, T[]> {
  return data.reduce((groups, item) => {
    const date = new Date(item[dateField] as string);
    let key: string;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0] ?? '';
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0] ?? '';
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = String(date.getFullYear());
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key]?.push(item);
    
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(
  currentPeriod: number,
  previousPeriod: number
): number {
  if (previousPeriod === 0) {
    return currentPeriod > 0 ? 100 : 0;
  }
  return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
}

/**
 * Smooth data using moving average
 */
export function movingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const windowStart = Math.max(0, i - windowSize + 1);
    const window = data.slice(windowStart, i + 1);
    result.push(average(window));
  }
  
  return result;
}

/**
 * Normalize data to 0-1 range
 */
export function normalize(data: number[]): number[] {
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal;
  
  if (range === 0) {
    return data.map(() => 0.5);
  }
  
  return data.map(value => (value - minVal) / range);
}
