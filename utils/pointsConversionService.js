import { supabase } from '../supabase';

export const PointsConversionService = {
  /**
   * Get all available rewards
   */
  getAvailableRewards: async () => {
    try {
      const { data, error } = await supabase
        .from('points_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (error) throw error;
      return { success: true, rewards: data };
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if member can afford reward
   */
  canAffordReward: async (memberId, rewardId) => {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('points')
        .eq('id', memberId)
        .single();

      const { data: reward } = await supabase
        .from('points_rewards')
        .select('points_cost, max_redemptions, total_redeemed')
        .eq('id', rewardId)
        .single();

      if (!member || !reward) return false;

      const hasEnoughPoints = member.points >= reward.points_cost;
      const hasAvailableSlots = !reward.max_redemptions || 
                                reward.total_redeemed < reward.max_redemptions;

      return hasEnoughPoints && hasAvailableSlots;
    } catch (error) {
      console.error('Error checking affordability:', error);
      return false;
    }
  },

  /**
   * Redeem a reward
   */
  redeemReward: async (memberId, rewardId) => {
    try {
      // Check affordability first
      const canAfford = await PointsConversionService.canAffordReward(memberId, rewardId);
      
      if (!canAfford) {
        return { 
          success: false, 
          error: 'Insufficient points or reward not available' 
        };
      }

      // Get reward details
      const { data: reward } = await supabase
        .from('points_rewards')
        .select('points_cost, title')
        .eq('id', rewardId)
        .single();

      // Create conversion record
      const { data, error } = await supabase
        .from('points_conversions')
        .insert({
          member_id: memberId,
          reward_id: rewardId,
          points_spent: reward.points_cost,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return { 
        success: true, 
        conversion: data,
        message: `Successfully redeemed: ${reward.title}` 
      };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get member's conversion history
   */
  getConversionHistory: async (memberId) => {
    try {
      const { data, error } = await supabase
        .from('points_conversions')
        .select(`
          *,
          reward:points_rewards(title, description, icon, reward_type)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, conversions: data };
    } catch (error) {
      console.error('Error fetching conversion history:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get pending conversions (admin function)
   */
  getPendingConversions: async () => {
    try {
      const { data, error } = await supabase
        .from('points_conversions')
        .select(`
          *,
          member:members(full_name, email),
          reward:points_rewards(title, description, reward_type)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, conversions: data };
    } catch (error) {
      console.error('Error fetching pending conversions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Approve conversion (admin function)
   */
  approveConversion: async (conversionId, adminId) => {
    try {
      const { data, error } = await supabase
        .from('points_conversions')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: adminId
        })
        .eq('id', conversionId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, conversion: data };
    } catch (error) {
      console.error('Error approving conversion:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reject conversion (admin function)
   */
  rejectConversion: async (conversionId, adminId, notes) => {
    try {
      // Get conversion details to refund points
      const { data: conversion } = await supabase
        .from('points_conversions')
        .select('member_id, points_spent')
        .eq('id', conversionId)
        .single();

      // Refund points to member
      await supabase
        .from('members')
        .update({ 
          points: supabase.raw(`points + ${conversion.points_spent}`)
        })
        .eq('id', conversion.member_id);

      // Update conversion status
      const { data, error } = await supabase
        .from('points_conversions')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: adminId,
          notes: notes
        })
        .eq('id', conversionId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, conversion: data };
    } catch (error) {
      console.error('Error rejecting conversion:', error);
      return { success: false, error: error.message };
    }
  }
};
