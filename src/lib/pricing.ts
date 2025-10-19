// Simplified Pricing Engine for DeSynth
import { supabase } from '@/integrations/supabase/client';

export type BookingVertical = 'cdmo' | 'sequencing' | 'cloud_lab' | 'fermentation' | 'academic';
export type FacilityType = 'bioprocessing' | 'cell_culture' | 'analytical' | 'formulation' | 'manufacturing';

export interface FeeRates {
  bookingCommission: { min: number; max: number; default: number }; // 5-15%
}

export interface BookingContext {
  vertical: BookingVertical;
  facilityType: FacilityType;
  transactionSize: number;
  isPriority?: boolean;
  paymentMethod: 'credit-card' | 'crypto';
}

export interface FeeBreakdown {
  baseAmount: number;
  bookingCommission: number;
  totalFees: number;
  totalAmount: number;
  netToFacility: number;
}

export const DEFAULT_FEE_RATES: FeeRates = {
  bookingCommission: { min: 0.02, max: 0.05, default: 0.03 }, // 2-5%
};

export class PricingEngine {
  private feeRates: FeeRates;
  
  constructor(customRates?: Partial<FeeRates>) {
    this.feeRates = { ...DEFAULT_FEE_RATES, ...customRates };
  }

  async loadCustomRates(): Promise<void> {
    try {
      // TODO: Load custom rates from database once types are regenerated
      // For now, keep using default rates
      console.log('Using default fee rates - custom rates loading not yet implemented');
    } catch (error) {
      console.warn('Could not load custom fee rates, using defaults:', error);
    }
  }

  calculateFees(baseAmount: number, context: BookingContext): FeeBreakdown {
    const fees: FeeBreakdown = {
      baseAmount,
      bookingCommission: 0,
      totalFees: 0,
      totalAmount: 0,
      netToFacility: 0
    };

    // Dynamic booking commission based on vertical and transaction size
    fees.bookingCommission = this.calculateBookingCommission(baseAmount, context);
    
    // Calculate totals
    fees.totalFees = fees.bookingCommission;
    fees.totalAmount = baseAmount + fees.totalFees;
    fees.netToFacility = baseAmount - fees.bookingCommission;

    return fees;
  }

  private calculateBookingCommission(baseAmount: number, context: BookingContext): number {
    let rate = this.feeRates.bookingCommission.default;

    // Dynamic pricing rules
    if (context.vertical === 'cdmo' && baseAmount > 0.01) {
      rate = this.feeRates.bookingCommission.min; // 2% for large CDMO runs
    } else if (context.vertical === 'sequencing' && baseAmount < 0.005) {
      rate = this.feeRates.bookingCommission.max; // 5% for small sequencing runs
    } else if (context.vertical === 'cloud_lab' && baseAmount >= 0.008) {
      rate = 0.035; // 3.5% for cloud lab bookings
    } else if (context.vertical === 'academic') {
      rate = 0.025; // 2.5% discount for academic customers
    }

    return baseAmount * rate;
  }

  // Subscription pricing for facilities
  getFacilitySubscriptionTiers() {
    return {
      starter: {
        name: 'Starter',
        price: 0.01, // 0.01 ETH
        features: ['Basic slot management', 'Standard support', 'Up to 10 active slots']
      },
      professional: {
        name: 'Professional', 
        price: 0.03, // 0.03 ETH
        features: ['Advanced analytics', 'Priority support', 'Up to 50 active slots', 'Custom compliance tracking']
      },
      enterprise: {
        name: 'Enterprise',
        price: 0.1, // 0.1 ETH
        features: ['White-label options', '24/7 support', 'Unlimited slots', 'API access', 'Custom integrations']
      }
    };
  }

  // Enterprise pricing (later stage features)
  getEnterprisePricing() {
    return {
      analytics: { 
        name: 'Data/Analytics Subscription',
        price: 0.15, // 0.15 ETH/year
        description: 'Advanced market intelligence and predictive analytics'
      },
      whiteLabel: {
        name: 'White-label/API License', 
        price: 0.25, // 0.25 ETH annual
        description: 'Full platform licensing with custom branding'
      }
    };
  }
}

export const pricingEngine = new PricingEngine();
