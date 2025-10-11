import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Server,
  Database,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Shield
} from 'lucide-react';

interface SystemMetrics {
  uptime: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  storageUsage: number;
  lastUpdated: string;
}

export const AdminSystemMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 99.96,
    activeConnections: 47,
    responseTime: 145,
    errorRate: 0.02,
    throughput: 1250,
    memoryUsage: 68,
    storageUsage: 34,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemMetrics();
    fetchSystemAlerts();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchSystemMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      
      // Simulate system metrics - in production, these would come from monitoring services
      const newMetrics: SystemMetrics = {
        uptime: 99.96 + (Math.random() - 0.5) * 0.1,
        activeConnections: 47 + Math.floor(Math.random() * 20 - 10),
        responseTime: 145 + Math.floor(Math.random() * 50 - 25),
        errorRate: 0.02 + (Math.random() - 0.5) * 0.01,
        throughput: 1250 + Math.floor(Math.random() * 200 - 100),
        memoryUsage: 68 + Math.floor(Math.random() * 10 - 5),
        storageUsage: 34 + Math.floor(Math.random() * 2),
        lastUpdated: new Date().toISOString()
      };
      
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: "Error fetching metrics",
        description: "Failed to load system metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      // In production, this would fetch real alerts from monitoring systems
      const mockAlerts = [
        {
          id: '1',
          type: 'warning',
          title: 'High Database Load',
          message: 'Database queries taking longer than usual',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          resolved: false
        },
        {
          id: '2',
          type: 'info',
          title: 'Scheduled Maintenance',
          message: 'Planned maintenance window in 2 hours',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          resolved: false
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default: return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitor</h2>
          <p className="text-muted-foreground">Real-time platform health and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSystemMetrics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold text-green-400">Operational</p>
              </div>
              <Server className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.uptime, { good: 99.5, warning: 99.0 })}`}>
                  {metrics.uptime.toFixed(2)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className={`text-2xl font-bold ${getStatusColor(300 - metrics.responseTime, { good: 200, warning: 100 })}`}>
                  {metrics.responseTime}ms
                </p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-primary">{metrics.activeConnections}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Response Time Metrics</CardTitle>
                <CardDescription>API endpoint performance over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Average Response Time</span>
                    <span className="font-semibold">{metrics.responseTime}ms</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (metrics.responseTime / 5))} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>95th Percentile</span>
                    <span className="font-semibold">{Math.floor(metrics.responseTime * 1.8)}ms</span>
                  </div>
                  <Progress value={Math.max(0, 100 - (metrics.responseTime * 1.8 / 8))} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Error Rate</span>
                    <span className={`font-semibold ${metrics.errorRate < 0.05 ? 'text-green-400' : 'text-red-400'}`}>
                      {metrics.errorRate.toFixed(3)}%
                    </span>
                  </div>
                  <Progress value={100 - (metrics.errorRate * 2000)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Throughput Metrics</CardTitle>
                <CardDescription>Request volume and processing capacity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Requests per Minute</span>
                    <span className="font-semibold text-primary">{metrics.throughput}</span>
                  </div>
                  <Progress value={(metrics.throughput / 2000) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Peak Capacity Usage</span>
                    <span className="font-semibold">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Database Queries/sec</span>
                    <span className="font-semibold">{Math.floor(metrics.throughput / 8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cache Hit Rate</span>
                    <span className="font-semibold text-green-400">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>CPU, memory, and storage utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Memory Usage</span>
                    <span className="font-semibold">{metrics.memoryUsage}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Storage Usage</span>
                    <span className="font-semibold">{metrics.storageUsage}%</span>
                  </div>
                  <Progress value={metrics.storageUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>CPU Usage</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
                <CardDescription>Database health and query performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Connection Pool</span>
                  <Badge className="bg-green-500/10 text-green-400">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Query Performance</span>
                  <Badge className="bg-green-500/10 text-green-400">Optimal</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Replication Lag</span>
                  <Badge className="bg-green-500/10 text-green-400">&lt; 50ms</Badge>
                </div>
                <div className="pt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Connections</span>
                    <span className="font-semibold">{metrics.activeConnections}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slow Queries</span>
                    <span className="font-semibold">2 (0.1%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Active alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
                  <h3 className="font-semibold mb-2">All Clear</h3>
                  <p className="text-muted-foreground">No active system alerts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>Platform security monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>SSL Certificate</span>
                  <Badge className="bg-green-500/10 text-green-400">
                    <Shield className="w-3 h-3 mr-1" />
                    Valid
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authentication System</span>
                  <Badge className="bg-green-500/10 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rate Limiting</span>
                  <Badge className="bg-green-500/10 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>DDoS Protection</span>
                  <Badge className="bg-green-500/10 text-green-400">
                    <Shield className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>Recent security-related activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed Login Attempts (24h)</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blocked IP Addresses</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate Limit Violations</span>
                    <span className="font-semibold">7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security Scans Passed</span>
                    <span className="font-semibold text-green-400">100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-right text-sm text-muted-foreground">
        Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};