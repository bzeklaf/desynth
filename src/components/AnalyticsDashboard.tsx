import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  MapPin,
  Clock,
  Activity
} from "lucide-react";

const AnalyticsDashboard = () => {
  // Analytics dashboard component for platform insights
  const analyticsData = {
    totalBookings: 1248,
    totalRevenue: 124800,
    activeSlots: 89,
    utilizationRate: 78,
    popularTimeSlots: [
      { time: "09:00-10:00", bookings: 124 },
      { time: "14:00-15:00", bookings: 98 },
      { time: "16:00-17:00", bookings: 87 }
    ],
    topFacilities: [
      { name: "Downtown Storage Hub", revenue: 24500, utilization: 92 },
      { name: "Port Authority Warehouse", revenue: 18200, utilization: 85 },
      { name: "Industrial Complex A", revenue: 15600, utilization: 76 }
    ],
    monthlyTrends: [
      { month: "Jan", bookings: 980, revenue: 98000 },
      { month: "Feb", bookings: 1120, revenue: 112000 },
      { month: "Mar", bookings: 1248, revenue: 124800 }
    ],
    userSegments: [
      { type: "Enterprise", count: 45, percentage: 15 },
      { type: "SME", count: 128, percentage: 43 },
      { type: "Individual", count: 125, percentage: 42 }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Slots</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeSlots}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+5</span> new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Booking Patterns</TabsTrigger>
          <TabsTrigger value="facilities">Facility Performance</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Booking and revenue trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="font-medium">{trend.month}</div>
                      <div className="text-right">
                        <div className="font-semibold">{trend.bookings} bookings</div>
                        <div className="text-sm text-muted-foreground">
                          ${trend.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Time Slots</CardTitle>
                <CardDescription>Most booked time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.popularTimeSlots.map((slot, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{slot.time}</span>
                        </div>
                        <Badge variant="secondary">{slot.bookings} bookings</Badge>
                      </div>
                      <Progress value={(slot.bookings / 124) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Facilities</CardTitle>
              <CardDescription>Revenue and utilization by facility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analyticsData.topFacilities.map((facility, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{facility.name}</div>
                      <div className="text-right">
                        <div className="font-semibold">${facility.revenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {facility.utilization}% utilized
                        </div>
                      </div>
                    </div>
                    <Progress value={facility.utilization} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Segments</CardTitle>
              <CardDescription>Breakdown of users by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.userSegments.map((segment, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{segment.type}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{segment.count} users</Badge>
                      </div>
                    </div>
                    <Progress value={segment.percentage} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {segment.percentage}% of total users
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;