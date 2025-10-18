// TODO: Create chat_channels and chat_messages tables
// This component is temporarily disabled until the required database tables are created

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const ChatSystem = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Chat System
        </CardTitle>
        <CardDescription>
          This feature is temporarily unavailable. Required database tables need to be created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The following tables need to be created: chat_channels and chat_messages
        </p>
      </CardContent>
    </Card>
  );
};
