import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'buyer' | 'facility' | 'auditor' | 'admin';

export const useRoleManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const assignRole = async (userId: string, role: UserRole) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Role already assigned",
            description: "This user already has this role.",
            variant: "destructive",
          });
          return { success: false, error };
        }
        throw error;
      }

      toast({
        title: "Role assigned",
        description: `Successfully assigned ${role} role to user.`,
      });

      return { success: true, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to assign role';
      toast({
        title: "Error assigning role",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (userId: string, role: UserRole) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Role removed",
        description: `Successfully removed ${role} role from user.`,
      });

      return { success: true, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove role';
      toast({
        title: "Error removing role",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, assigned_at')
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, roles: data || [], error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user roles';
      toast({
        title: "Error fetching roles",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, roles: [], error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    assignRole,
    removeRole,
    getUserRoles,
  };
};
