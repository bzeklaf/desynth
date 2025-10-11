// Dynamic Pricing Engine for DeSynth Revenue Model
import { supabase } from '@/integrations/supabase/client';

export type BookingVertical = 'cdmo' | 'sequencing' | 'cloud_lab' | 'fermentation' | 'academic';
export type FacilityType = 'bioprocessing' | 'cell_culture' | 'analytical' | 'formulation' | 'manufacturing';

export interface FeeRates {
  bookingCommission: { min: number; max: number; default: number }; // 5-15%
  escrowServiceFee: { min: number; max: number; default: number }; // 0.5-1%
  tokenizationFee: { flat: number; percentage: number }; // $10-50 or 0.25-0.5% GMV
  fractionalizationFee: { min: number; max: number; default: number }; // 1-2%
  stablecoinSettlementFee: { min: number; max: number; default: number }; // 0.5-1%
  insurancePoolFee: { min: number; max: number; default: number }; // 0.25-0.5% GMV
  auditorNetworkFee: { min: number; max: number; default: number }; // $250-500 per booking
  priorityMatchingFee: { min: number; max: number; default: number }; // +2-5% premium
}

export interface BookingContext {
  vertical: BookingVertical;
  facilityType: FacilityType;
  transactionSize: number;
  isPriority?: boolean;
  requiresTokenization?: boolean;
  requiresInsurance?: boolean;
  paymentMethod: 'credit-card' | 'crypto' | 'bank-transfer';
}

export interface FeeBreakdown {
  baseAmount: number;
  bookingCommission: number;
  escrowServiceFee: number;
  tokenizationFee: number;
  stablecoinSettlementFee: number;
  insurancePoolFee: number;
  auditorNetworkFee: number;
  priorityMatchingFee: number;
  totalFees: number;
  totalAmount: number;
  netToFacility: number;
}

export const DEFAULT_FEE_RATES: FeeRates = {
  bookingCommission: { min: 0.02, max: 0.05, default: 0.03 }, // Lowered to 2-5%
  escrowServiceFee: { min: 0.001, max: 0.002, default: 0.0015 }, // Lowered to 0.1-0.2%
  tokenizationFee: { flat: 0.001, percentage: 0.0005 }, // 0.001 ETH or 0.05%
  fractionalizationFee: { min: 0.002, max: 0.005, default: 0.003 }, // Lowered to 0.2-0.5%
  stablecoinSettlementFee: { min: 0.001, max: 0.002, default: 0.0015 }, // Lowered to 0.1-0.2%
  insurancePoolFee: { min: 0.0005, max: 0.001, default: 0.00075 }, // Lowered to 0.05-0.1%
  auditorNetworkFee: { min: 0.002, max: 0.005, default: 0.003 }, // 0.002-0.005 ETH per booking
  priorityMatchingFee: { min: 0.005, max: 0.01, default: 0.0075 } // Lowered to 0.5-1%
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
      escrowServiceFee: 0,
      tokenizationFee: 0,
      stablecoinSettlementFee: 0,
      insurancePoolFee: 0,
      auditorNetworkFee: 0,
      priorityMatchingFee: 0,
      totalFees: 0,
      totalAmount: 0,
      netToFacility: 0
    };

    // Dynamic booking commission based on vertical and transaction size
    fees.bookingCommission = this.calculateBookingCommission(baseAmount, context);
    
    // Escrow service fee (always applicable for crypto, optional for others)
    if (context.paymentMethod === 'crypto') {
      fees.escrowServiceFee = baseAmount * this.feeRates.escrowServiceFee.default;
    }

    // Tokenization fee (crypto payments or when explicitly requested)
    if (context.requiresTokenization || context.paymentMethod === 'crypto') {
      fees.tokenizationFee = this.calculateTokenizationFee(baseAmount);
    }

    // Stablecoin settlement fee (crypto payments only)
    if (context.paymentMethod === 'crypto') {
      fees.stablecoinSettlementFee = baseAmount * this.feeRates.stablecoinSettlementFee.default;
    }

    // Insurance pool fee (when insurance is required)
    if (context.requiresInsurance) {
      fees.insurancePoolFee = baseAmount * this.feeRates.insurancePoolFee.default;
    }

    // Auditor network fee (flat fee per booking)
    fees.auditorNetworkFee = this.feeRates.auditorNetworkFee.default;

    // Priority matching fee (when priority is requested)
    if (context.isPriority) {
      fees.priorityMatchingFee = baseAmount * this.feeRates.priorityMatchingFee.default;
    }

    // Calculate totals
    fees.totalFees = Object.keys(fees)
      .filter(key => key !== 'baseAmount' && key !== 'totalFees' && key !== 'totalAmount' && key !== 'netToFacility')
      .reduce((sum, key) => sum + fees[key as keyof FeeBreakdown], 0);
    
    fees.totalAmount = baseAmount + fees.totalFees;
    fees.netToFacility = baseAmount - fees.bookingCommission - fees.auditorNetworkFee - fees.priorityMatchingFee;

    return fees;
  }

  private calculateBookingCommission(baseAmount: number, context: BookingContext): number {
    let rate = this.feeRates.bookingCommission.default;

    // Dynamic pricing rules - updated for testing with smaller amounts
    if (context.vertical === 'cdmo' && baseAmount > 0.01) { // Changed from 50000
      rate = this.feeRates.bookingCommission.min; // 2% for large CDMO runs
    } else if (context.vertical === 'sequencing' && baseAmount < 0.005) { // Changed from 2000
      rate = this.feeRates.bookingCommission.max; // 5% for small sequencing runs
    } else if (context.vertical === 'cloud_lab' && baseAmount >= 0.008) { // Changed from 10000
      rate = 0.035; // 3.5% for cloud lab bookings
    } else if (context.vertical === 'academic') {
      rate = 0.025; // 2.5% discount for academic customers
    }

    return baseAmount * rate;
  }

  private calculateTokenizationFee(baseAmount: number): number {
    const flatFee = this.feeRates.tokenizationFee.flat;
    const percentageFee = baseAmount * this.feeRates.tokenizationFee.percentage;
    
    // Use whichever is higher, but cap at 0.01 ETH for small transactions
    return Math.min(Math.max(flatFee, percentageFee), 0.01);
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