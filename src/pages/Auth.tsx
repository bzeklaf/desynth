import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogIn, UserPlus, Building, ShoppingCart, Shield, Settings } from 'lucide-react';

export const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, profile, loading, resendVerification, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Don't redirect while still loading - wait for profile to be loaded
  useEffect(() => {
    if (!loading && user && profile) {
      navigate('/dashboard');
    }
  }, [user, profile, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const { error } = await signIn(email, password);
      
      if (!error) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const role = formData.get('role') as string;

      await signUp(email, password, firstName, lastName, role);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (source: 'signin' | 'signup') => {
    const inputId = source === 'signin' ? 'signin-email' : 'signup-email';
    const email = (document.getElementById(inputId) as HTMLInputElement)?.value;
    if (!email) return;
    setIsLoading(true);
    try {
      await resendVerification(email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = (document.getElementById('signin-email') as HTMLInputElement)?.value;
    if (!email) return;
    setIsLoading(true);
    try {
      await resetPassword(email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 left-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            ← Back to Home
          </Button>
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold gradient-text">BioSynthFi</h1>
          <p className="text-muted-foreground">Decentralized Biomanufacturing Protocol</p>
        </div>

        <Tabs defaultValue="signin" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your BioSynthFi account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="flex items-center justify-between mt-2">
                    <Button type="button" variant="link" className="px-0" onClick={() => handleResend('signin')}>
                      Resend verification email
                    </Button>
                    <Button type="button" variant="link" className="px-0" onClick={handleResetPassword}>
                      Forgot password?
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>
                  Join the BioSynthFi marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Buyer - Purchase lab time and services
                          </div>
                        </SelectItem>
                        <SelectItem value="facility">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Facility - Provide biomanufacturing services
                          </div>
                        </SelectItem>
                        <SelectItem value="auditor">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Auditor - Verify compliance and quality
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                  <div className="text-center mt-2">
                    <Button type="button" variant="link" className="px-0" onClick={() => handleResend('signup')}>
                      Didn't get the email? Resend verification
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <div className="text-sm text-muted-foreground">
            Join the decentralized biomanufacturing marketplace
          </div>
        </div>
      </div>
    </div>
  );
};