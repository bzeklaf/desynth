import { Navigation } from '@/components/Navigation';
import { UserProfile } from '@/components/UserProfile';
import { FacilityRegistration } from '@/components/FacilityRegistration';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Profile = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showFacilityRegistration, setShowFacilityRegistration] = useState(false);

  useEffect(() => {
    if (profile?.role === 'facility') {
      setActiveTab('profile');
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">Manage your account and settings</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="facility" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {profile?.role === 'facility' ? 'My Facility' : 'Register Facility'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>

          <TabsContent value="facility">
            {profile?.role === 'facility' && !showFacilityRegistration ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Facility Management</h2>
                  <Button onClick={() => setShowFacilityRegistration(true)}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Register New Facility
                  </Button>
                </div>
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Facility management coming soon</h3>
                  <p className="text-muted-foreground">
                    View and manage your registered facilities here.
                  </p>
                </div>
              </div>
            ) : (
              <FacilityRegistration 
                onRegistrationComplete={() => setShowFacilityRegistration(false)}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};