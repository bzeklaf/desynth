import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'raw_materials' | 'consumables' | 'equipment' | 'chemicals' | 'media';
  sku: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  max_capacity: number;
  cost_per_unit: number;
  supplier: string;
  location: string;
  expiry_date?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  last_updated: string;
}

interface NewItemForm {
  name: string;
  category: string;
  sku: string;
  quantity: string;
  unit: string;
  min_threshold: string;
  max_capacity: string;
  cost_per_unit: string;
  supplier: string;
  location: string;
  expiry_date: string;
}

export const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState<NewItemForm>({
    name: '',
    category: '',
    sku: '',
    quantity: '',
    unit: '',
    min_threshold: '',
    max_capacity: '',
    cost_per_unit: '',
    supplier: '',
    location: '',
    expiry_date: ''
  });
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    loadInventory();
  }, [categoryFilter, statusFilter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      
      // Mock inventory data - replace with actual Supabase query
      const mockInventory: InventoryItem[] = [
        {
          id: '1',
          name: 'DMEM Culture Medium',
          category: 'media',
          sku: 'MED-001',
          quantity: 45,
          unit: 'L',
          min_threshold: 10,
          max_capacity: 100,
          cost_per_unit: 25.50,
          supplier: 'BioSupply Co',
          location: 'Cold Room A-1',
          expiry_date: '2024-06-15',
          status: 'in_stock',
          last_updated: '2024-01-10T10:30:00Z'
        },
        {
          id: '2',
          name: 'Single-Use Bioreactor Bags',
          category: 'consumables',
          sku: 'CON-045',
          quantity: 5,
          unit: 'units',
          min_threshold: 10,
          max_capacity: 50,
          cost_per_unit: 150.00,
          supplier: 'BioTech Solutions',
          location: 'Storage B-3',
          status: 'low_stock',
          last_updated: '2024-01-09T14:20:00Z'
        },
        {
          id: '3',
          name: 'Glucose Monohydrate',
          category: 'raw_materials',
          sku: 'RAW-123',
          quantity: 0,
          unit: 'kg',
          min_threshold: 5,
          max_capacity: 25,
          cost_per_unit: 12.75,
          supplier: 'ChemCorp',
          location: 'Dry Storage A-2',
          status: 'out_of_stock',
          last_updated: '2024-01-08T09:15:00Z'
        },
        {
          id: '4',
          name: 'pH Sensor Calibration Solution',
          category: 'chemicals',
          sku: 'CHE-078',
          quantity: 8,
          unit: 'bottles',
          min_threshold: 3,
          max_capacity: 20,
          cost_per_unit: 45.00,
          supplier: 'Analytical Systems',
          location: 'Chemical Cabinet C-1',
          expiry_date: '2024-03-20',
          status: 'in_stock',
          last_updated: '2024-01-11T16:45:00Z'
        },
        {
          id: '5',
          name: 'Sterile Filter Units (0.22μm)',
          category: 'consumables',
          sku: 'CON-089',
          quantity: 25,
          unit: 'units',
          min_threshold: 15,
          max_capacity: 100,
          cost_per_unit: 8.50,
          supplier: 'FilterTech Inc',
          location: 'Storage B-1',
          status: 'in_stock',
          last_updated: '2024-01-12T11:20:00Z'
        }
      ];

      setInventory(mockInventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: "Error loading inventory",
        description: "Failed to load inventory data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = async () => {
    try {
      if (!newItem.name || !newItem.category || !newItem.sku || !newItem.quantity) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // In real implementation, save to Supabase
      const newInventoryItem: InventoryItem = {
        id: Date.now().toString(),
        name: newItem.name,
        category: newItem.category as InventoryItem['category'],
        sku: newItem.sku,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit || 'units',
        min_threshold: parseFloat(newItem.min_threshold) || 0,
        max_capacity: parseFloat(newItem.max_capacity) || 100,
        cost_per_unit: parseFloat(newItem.cost_per_unit) || 0,
        supplier: newItem.supplier,
        location: newItem.location,
        expiry_date: newItem.expiry_date || undefined,
        status: 'in_stock',
        last_updated: new Date().toISOString()
      };

      setInventory(prev => [newInventoryItem, ...prev]);
      setShowAddDialog(false);
      setNewItem({
        name: '',
        category: '',
        sku: '',
        quantity: '',
        unit: '',
        min_threshold: '',
        max_capacity: '',
        cost_per_unit: '',
        supplier: '',
        location: '',
        expiry_date: ''
      });

      toast({
        title: "Item added successfully",
        description: `${newItem.name} has been added to inventory.`,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error adding item",
        description: "Failed to add inventory item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    try {
      // In real implementation, update Supabase
      setInventory(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              quantity: newQuantity,
              status: newQuantity === 0 ? 'out_of_stock' : 
                     newQuantity <= item.min_threshold ? 'low_stock' : 'in_stock',
              last_updated: new Date().toISOString()
            }
          : item
      ));

      toast({
        title: "Quantity updated",
        description: "Item quantity has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error updating quantity",
        description: "Failed to update item quantity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'raw_materials':
        return '🧪';
      case 'consumables':
        return '📦';
      case 'equipment':
        return '⚙️';
      case 'chemicals':
        return '🧬';
      case 'media':
        return '🥤';
      default:
        return '📋';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockItems = inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">{formatDate(new Date().toISOString())}</p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Management
          </CardTitle>
          <CardDescription>Manage your facility's inventory and supplies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name, SKU, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="raw_materials">Raw Materials</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="chemicals">Chemicals</SelectItem>
                <SelectItem value="media">Media</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new inventory item
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raw_materials">Raw Materials</SelectItem>
                        <SelectItem value="consumables">Consumables</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="chemicals">Chemicals</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={newItem.sku}
                      onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Enter SKU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={newItem.unit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="units, kg, L, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addNewItem}>
                    Add Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Inventory Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.location}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{item.sku}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity} {item.unit}</span>
                        {item.quantity <= item.min_threshold && (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>${(item.quantity * item.cost_per_unit).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};