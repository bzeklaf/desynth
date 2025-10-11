import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Wallet,
  RefreshCw
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'digital';
  name: string;
  details: string;
  isDefault: boolean;
  status: 'active' | 'expired' | 'pending';
}

interface Transaction {
  id: string;
  amount: number;
  type: 'payment' | 'refund' | 'payout';
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  description: string;
  paymentMethod: string;
}

const PaymentProcessor = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "1",
      type: "card",
      name: "Visa •••• 4242",
      details: "Expires 12/25",
      isDefault: true,
      status: "active"
    },
    {
      id: "2",
      type: "bank",
      name: "Chase Business Account",
      details: "•••• 8901",
      isDefault: false,
      status: "active"
    },
    {
      id: "3",
      type: "digital",
      name: "PayPal Business",
      details: "business@company.com",
      isDefault: false,
      status: "active"
    }
  ];

  const transactions: Transaction[] = [
    {
      id: "TXN001",
      amount: 250.00,
      type: "payment",
      status: "completed",
      date: new Date(2024, 2, 15, 14, 30),
      description: "Slot booking - Downtown Storage Hub",
      paymentMethod: "Visa •••• 4242"
    },
    {
      id: "TXN002",
      amount: 1200.00,
      type: "payout",
      status: "pending",
      date: new Date(2024, 2, 14, 9, 15),
      description: "Monthly facility payout",
      paymentMethod: "Chase Business Account"
    },
    {
      id: "TXN003",
      amount: 75.00,
      type: "refund",
      status: "completed",
      date: new Date(2024, 2, 13, 16, 45),
      description: "Cancelled booking refund",
      paymentMethod: "Visa •••• 4242"
    }
  ];

  const handleProcessPayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Center</h2>
          <p className="text-muted-foreground">
            Manage payments, methods, and transaction history
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Payments
        </Button>
      </div>

      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,235.50</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,200.00</div>
            <p className="text-xs text-muted-foreground">
              Processing in 2-3 business days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.9%</div>
            <p className="text-xs text-muted-foreground">
              Average transaction fee
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="methods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="process">Process Payment</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {method.type === 'card' && <CreditCard className="w-8 h-8 text-blue-600" />}
                        {method.type === 'bank' && <Wallet className="w-8 h-8 text-green-600" />}
                        {method.type === 'digital' && <Shield className="w-8 h-8 text-purple-600" />}
                      </div>
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">{method.details}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Badge variant={method.status === 'active' ? 'default' : 'secondary'}>
                        {method.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add New Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent payment activity and transaction details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(transaction.date)} • {transaction.paymentMethod}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.type === 'refund' ? 'text-red-600' :
                        transaction.type === 'payout' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {transaction.type === 'refund' ? '-' : 
                         transaction.type === 'payout' ? '+' : ''}
                        ${transaction.amount.toFixed(2)}
                      </div>
                      <div className={`text-sm ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Payment</CardTitle>
              <CardDescription>Process a new payment or refund</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Payment description"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={method.id}
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={method.id} className="flex items-center space-x-2">
                        {method.type === 'card' && <CreditCard className="w-4 h-4" />}
                        {method.type === 'bank' && <Wallet className="w-4 h-4" />}
                        {method.type === 'digital' && <Shield className="w-4 h-4" />}
                        <span>{method.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Processing fee: 2.9% + $0.30
                </div>
                <Button 
                  onClick={handleProcessPayment}
                  disabled={processing || !selectedMethod}
                  className="min-w-[120px]"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process Payment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment preferences and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-payout</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically transfer earnings to your account
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Payment notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified about payment updates
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Security settings</div>
                    <div className="text-sm text-muted-foreground">
                      Two-factor authentication and security preferences
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentProcessor;