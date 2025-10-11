import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBlockchain } from "@/hooks/useBlockchain";
import { WalletConnection } from "./WalletConnection";
import { 
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  Coins,
  Zap,
  Link as LinkIcon
} from "lucide-react";

interface BlockchainStatusProps {
  className?: string;
}

export const BlockchainStatus = ({ className }: BlockchainStatusProps) => {
  const { 
    address, 
    isConnected, 
    chain, 
    ethBalance,
    isProcessing 
  } = useBlockchain();

  const getNetworkStatus = () => {
    if (!isConnected) return { status: 'disconnected', color: 'destructive' };
    if (chain?.name === 'Sepolia' || chain?.name === 'Arbitrum Sepolia') {
      return { status: 'testnet', color: 'secondary' };
    }
    return { status: 'unknown', color: 'destructive' };
  };

  const networkStatus = getNetworkStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Status
          </CardTitle>
          <CardDescription>
            Your blockchain connection and wallet information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection</span>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    Connected
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                    Disconnected
                  </Badge>
                </>
              )}
            </div>
          </div>

          {isConnected && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                <Badge 
                  variant={networkStatus.color as any}
                  className="flex items-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" />
                  {chain?.name || 'Unknown'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Address</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
              </div>
            </>
          )}

          <div className="pt-2">
            <WalletConnection showBalance={true} />
          </div>
        </CardContent>
      </Card>

      {/* Balance Information */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Balance & Tokens
            </CardTitle>
            <CardDescription>
              Your available tokens for payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-500" />
                <span className="font-medium">ETH</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{ethBalance}</div>
                <div className="text-xs text-muted-foreground">Ethereum</div>
              </div>
            </div>

            {parseFloat(ethBalance) === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need ETH tokens to make crypto payments. You can get testnet ETH from faucets.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction Status */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Transaction Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Processing transaction...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Warnings */}
      {isConnected && networkStatus.status !== 'testnet' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please switch to Sepolia or Arbitrum Sepolia testnet for testing.
          </AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            Connect your wallet to access crypto payment features.
            <WalletConnection showBalance={false} className="ml-2" />
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};