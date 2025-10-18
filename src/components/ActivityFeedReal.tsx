// TODO: Fix foreign key relationships and create attestations table
// This component is temporarily disabled until the required database relations are fixed

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const ActivityFeedReal = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>
          This feature is temporarily unavailable. Database foreign key relationships need to be configured.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Foreign key relationships need to be created for bookings.buyer_id and the attestations table needs to be created.
        </p>
      </CardContent>
    </Card>
  );
};
