import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { SlotBookingFlow } from './SlotBookingFlow';
import {
  Star,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Beaker,
  Factory,
  Shield,
  Users,
  CheckCircle
} from 'lucide-react';

interface FeaturedSlot {
  id: string;
  title: string;
  description?: string;
  facility: {
    name: string;
    location: string;
    reputation_score: number;
  };
  start_date: string;
  end_date: string;
  duration_hours: number;
  price: number;
  compliance_level: string;
  equipment: string;
  scale_capacity?: string;
  featured_reason: 'popular' | 'new' | 'premium' | 'urgent';
  discount_percentage?: number;
}

interface SlotDetailsModalProps {
  slot: FeaturedSlot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SlotDetailsModal = ({ slot, isOpen, onClose }: SlotDetailsModalProps) => {
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!slot) return null;

  const handleBookNow = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowBookingFlow(true);
  };

  const handleCloseBookingFlow = () => {
    setShowBookingFlow(false);
  };

  const getFeaturedBadge = (reason: string) => {
    switch (reason) {
      case 'popular':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">🔥 Popular</Badge>;
      case 'new':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">✨ New</Badge>;
      case 'premium':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">⭐ Premium</Badge>;
      case 'urgent':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">⚡ Urgent</Badge>;
      default:
        return <Badge variant="outline">Featured</Badge>;
    }
  };

  if (showBookingFlow) {
    return (
      <SlotBookingFlow 
        slotId={slot.id} 
        onClose={handleCloseBookingFlow}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{slot.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with pricing and featured badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              {getFeaturedBadge(slot.featured_reason)}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{slot.facility.name}</span>
                <span>•</span>
                <span>{slot.facility.location}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 ml-1" />
                <span>{slot.facility.reputation_score}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                ${slot.price.toLocaleString()}
              </div>
              {slot.discount_percentage && (
                <div className="text-lg text-muted-foreground line-through">
                  ${Math.round(slot.price / (1 - slot.discount_percentage / 100)).toLocaleString()}
                </div>
              )}
              {slot.discount_percentage && (
                <Badge variant="destructive" className="bg-red-500 text-white mt-1">
                  -{slot.discount_percentage}% OFF
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {slot.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{slot.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule & Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                  <div className="text-lg font-semibold">{formatDate(slot.start_date)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">End Date</div>
                  <div className="text-lg font-semibold">{formatDate(slot.end_date)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Duration</div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg font-semibold">{slot.duration_hours} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment & Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="w-5 h-5" />
                  Equipment & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Equipment</div>
                  <div className="font-semibold">{slot.equipment}</div>
                </div>
                {slot.scale_capacity && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Scale Capacity</div>
                    <div className="flex items-center gap-1">
                      <Factory className="w-4 h-4" />
                      <span className="font-semibold">{slot.scale_capacity}</span>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Compliance Level</div>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <Award className="w-3 h-3" />
                    {slot.compliance_level.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facility Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Facility Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Facility Name</div>
                  <div className="font-semibold">{slot.facility.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Location</div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-semibold">{slot.facility.location}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Reputation Score</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{slot.facility.reputation_score}/5.0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>GMP Certified Facility</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>24/7 Quality Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Regulatory Compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Expert Technical Support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handleBookNow} size="lg" className="flex-1">
              <DollarSign className="w-4 h-4 mr-2" />
              Book This Slot
            </Button>
            <Button variant="outline" onClick={onClose} size="lg" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};