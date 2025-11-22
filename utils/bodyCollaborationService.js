import { supabase } from '../supabase';

export const BodyCollaborationService = {
  // ============================================================================
  // PARTNERSHIPS
  // ============================================================================

  /**
   * Create partnership request
   */
  createPartnership: async (initiatorBodyId, partnerBodyId, partnershipData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_partnerships')
        .insert({
          initiator_body_id: initiatorBodyId,
          partner_body_id: partnerBodyId,
          partnership_type: partnershipData.partnershipType,
          title: partnershipData.title,
          description: partnershipData.description,
          objectives: partnershipData.objectives,
          start_date: partnershipData.startDate,
          end_date: partnershipData.endDate,
          terms: partnershipData.terms,
          expected_outcomes: partnershipData.expectedOutcomes,
          resources_committed: partnershipData.resourcesCommitted,
          status: 'pending',
          initiated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, partnership: data };
    } catch (error) {
      console.error('Error creating partnership:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get body partnerships with filtering (FIXED - without JOINs)
   */
  getBodyPartnerships: async (bodyId, status = null) => {
    try {
      // 1. Fetch partnerships first
      let query = supabase
        .from('body_partnerships')
        .select('*')
        .or(`initiator_body_id.eq.${bodyId},partner_body_id.eq.${bodyId}`)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: partnerships, error } = await query;

      if (error) throw error;

      // 2. If partnerships exist, fetch body details separately
      if (partnerships && partnerships.length > 0) {
        // Get all unique body IDs
        const bodyIds = [...new Set([
          ...partnerships.map(p => p.initiator_body_id),
          ...partnerships.map(p => p.partner_body_id)
        ].filter(Boolean))];

        // Fetch bodies
        const { data: bodies } = await supabase
          .from('bodies')
          .select('id, name, logo_url, body_type')
          .in('id', bodyIds);

        // Get all unique member IDs (initiated_by)
        const memberIds = [...new Set(partnerships.map(p => p.initiated_by).filter(Boolean))];

        // Fetch members
        const { data: members } = await supabase
          .from('members')
          .select('id, full_name')
          .in('id', memberIds);

        // 3. Attach related data to each partnership
        partnerships.forEach(partnership => {
          partnership.initiator = bodies?.find(b => b.id === partnership.initiator_body_id) || null;
          partnership.partner = bodies?.find(b => b.id === partnership.partner_body_id) || null;
          partnership.initiator_member = members?.find(m => m.id === partnership.initiated_by) || null;
        });
      }

      return { success: true, partnerships: partnerships || [] };
    } catch (error) {
      console.error('Error getting partnerships:', error);
      return { success: false, error: error.message, partnerships: [] };
    }
  },

  /**
   * Get partnership by ID
   */
  getPartnershipById: async (partnershipId) => {
    try {
      const { data, error } = await supabase
        .from('body_partnerships')
        .select(`
          *,
          initiator:bodies!body_partnerships_initiator_body_id_fkey(*),
          partner:bodies!body_partnerships_partner_body_id_fkey(*),
          initiator_member:members!body_partnerships_initiated_by_fkey(full_name, email)
        `)
        .eq('id', partnershipId)
        .single();

      if (error) throw error;
      return { success: true, partnership: data };
    } catch (error) {
      console.error('Error getting partnership:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update partnership status (accept/reject)
   */
  updatePartnershipStatus: async (partnershipId, status, responseNotes = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_partnerships')
        .update({
          status,
          responded_by: user.id,
          response_notes: responseNotes,
          responded_at: new Date().toISOString(),
        })
        .eq('id', partnershipId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, partnership: data };
    } catch (error) {
      console.error('Error updating partnership:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update partnership details
   */
  updatePartnership: async (partnershipId, updates) => {
    try {
      const { data, error } = await supabase
        .from('body_partnerships')
        .update(updates)
        .eq('id', partnershipId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, partnership: data };
    } catch (error) {
      console.error('Error updating partnership:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * End partnership
   */
  endPartnership: async (partnershipId, reason = null) => {
    try {
      const { data, error } = await supabase
        .from('body_partnerships')
        .update({
          status: 'ended',
          end_reason: reason,
          actual_end_date: new Date().toISOString(),
        })
        .eq('id', partnershipId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, partnership: data };
    } catch (error) {
      console.error('Error ending partnership:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // JOINT CAMPAIGNS
  // ============================================================================

  /**
   * Create joint campaign
   */
  createCampaign: async (campaignData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('joint_campaigns')
        .insert({
          campaign_name: campaignData.campaignName,
          description: campaignData.description,
          campaign_type: campaignData.campaignType,
          lead_body_id: campaignData.leadBodyId,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate,
          target_amount: campaignData.targetAmount,
          current_amount: 0,
          target_signatures: campaignData.targetSignatures,
          current_signatures: 0,
          visibility: campaignData.visibility || 'public',
          status: 'active',
          created_by: user.id,
          goals: campaignData.goals,
          attachments: campaignData.attachments,
        })
        .select()
        .single();

      if (error) throw error;

      // Add lead body as partner
      await BodyCollaborationService.addCampaignPartner(
        data.id,
        campaignData.leadBodyId,
        'lead',
        'primary'
      );

      return { success: true, campaign: data };
    } catch (error) {
      console.error('Error creating campaign:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get joint campaigns with partners
   */
  getCampaigns: async (bodyId = null, status = 'active') => {
    try {
      let query = supabase
        .from('joint_campaigns')
        .select(`
          *,
          lead_body:bodies!joint_campaigns_lead_body_id_fkey(
            id, 
            name, 
            logo_url, 
            body_type
          ),
          partners:campaign_partners(
            body:bodies(id, name, logo_url),
            role,
            contribution_type,
            status
          ),
          creator:members!joint_campaigns_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (bodyId) {
        // Get campaigns where body is lead or partner
        const { data: partnerCampaigns } = await supabase
          .from('campaign_partners')
          .select('campaign_id')
          .eq('body_id', bodyId);

        const campaignIds = partnerCampaigns?.map((p) => p.campaign_id) || [];
        
        if (campaignIds.length > 0) {
          query = query.or(`lead_body_id.eq.${bodyId},id.in.(${campaignIds.join(',')})`);
        } else {
          query = query.eq('lead_body_id', bodyId);
        }
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, campaigns: data || [] };
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return { success: false, error: error.message, campaigns: [] };
    }
  },

  /**
   * Get campaign by ID
   */
  getCampaignById: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('joint_campaigns')
        .select(`
          *,
          lead_body:bodies!joint_campaigns_lead_body_id_fkey(*),
          partners:campaign_partners(
            *,
            body:bodies(*)
          ),
          creator:members!joint_campaigns_created_by_fkey(full_name, email)
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return { success: true, campaign: data };
    } catch (error) {
      console.error('Error getting campaign:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update campaign
   */
  updateCampaign: async (campaignId, updates) => {
    try {
      const { data, error } = await supabase
        .from('joint_campaigns')
        .update(updates)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, campaign: data };
    } catch (error) {
      console.error('Error updating campaign:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add partner to campaign
   */
  addCampaignPartner: async (campaignId, bodyId, role, contributionType = null) => {
    try {
      const { data, error } = await supabase
        .from('campaign_partners')
        .insert({
          campaign_id: campaignId,
          body_id: bodyId,
          role,
          contribution_type: contributionType,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, partner: data };
    } catch (error) {
      console.error('Error adding campaign partner:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove partner from campaign
   */
  removeCampaignPartner: async (campaignId, bodyId) => {
    try {
      const { error } = await supabase
        .from('campaign_partners')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('body_id', bodyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing campaign partner:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update campaign progress
   */
  updateCampaignProgress: async (campaignId, progressData) => {
    try {
      const updates = {};
      
      if (progressData.amount !== undefined) {
        updates.current_amount = progressData.amount;
      }
      if (progressData.signatures !== undefined) {
        updates.current_signatures = progressData.signatures;
      }

      const { data, error } = await supabase
        .from('joint_campaigns')
        .update(updates)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, campaign: data };
    } catch (error) {
      console.error('Error updating campaign progress:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // RESOURCE SHARING
  // ============================================================================

  /**
   * Create/share resource
   */
  createResource: async (bodyId, resourceData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('shared_resources')
        .insert({
          body_id: bodyId,
          resource_type: resourceData.resourceType,
          resource_name: resourceData.resourceName,
          description: resourceData.description,
          availability: resourceData.availability || 'available',
          sharing_terms: resourceData.sharingTerms || 'free',
          cost: resourceData.cost || 0,
          location: resourceData.location,
          capacity: resourceData.capacity,
          current_usage: 0,
          requirements: resourceData.requirements,
          contact_person: user.id,
          tags: resourceData.tags,
          images: resourceData.images,
          documents: resourceData.documents,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, resource: data };
    } catch (error) {
      console.error('Error creating resource:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get available resources with advanced filtering
   */
  getResources: async (filters = {}) => {
    try {
      let query = supabase
        .from('shared_resources')
        .select(`
          *,
          body:bodies(id, name, logo_url, city, country),
          contact:members!shared_resources_contact_person_fkey(full_name, email, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters.availability) {
        query = query.eq('availability', filters.availability);
      }

      if (filters.bodyId) {
        query = query.eq('body_id', filters.bodyId);
      }

      if (filters.sharingTerms) {
        query = query.eq('sharing_terms', filters.sharingTerms);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.tags) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, resources: data || [] };
    } catch (error) {
      console.error('Error getting resources:', error);
      return { success: false, error: error.message, resources: [] };
    }
  },

  /**
   * Get resource by ID
   */
  getResourceById: async (resourceId) => {
    try {
      const { data, error } = await supabase
        .from('shared_resources')
        .select(`
          *,
          body:bodies(*),
          contact:members!shared_resources_contact_person_fkey(*)
        `)
        .eq('id', resourceId)
        .single();

      if (error) throw error;
      return { success: true, resource: data };
    } catch (error) {
      console.error('Error getting resource:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update resource
   */
  updateResource: async (resourceId, updates) => {
    try {
      const { data, error } = await supabase
        .from('shared_resources')
        .update(updates)
        .eq('id', resourceId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, resource: data };
    } catch (error) {
      console.error('Error updating resource:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete resource
   */
  deleteResource: async (resourceId) => {
    try {
      const { error } = await supabase
        .from('shared_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting resource:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Request resource
   */
  requestResource: async (resourceId, requestingBodyId, requestData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('resource_requests')
        .insert({
          resource_id: resourceId,
          requesting_body_id: requestingBodyId,
          requested_by: user.id,
          request_date: requestData.requestDate,
          end_date: requestData.endDate,
          purpose: requestData.purpose,
          quantity: requestData.quantity || 1,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, request: data };
    } catch (error) {
      console.error('Error requesting resource:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get resource requests
   */
  getResourceRequests: async (bodyId, type = 'received') => {
    try {
      let query = supabase
        .from('resource_requests')
        .select(`
          *,
          resource:shared_resources(*),
          requesting_body:bodies!resource_requests_requesting_body_id_fkey(id, name, logo_url),
          requester:members!resource_requests_requested_by_fkey(full_name, email, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (type === 'received') {
        // Requests for resources owned by this body
        const { data: bodyResources } = await supabase
          .from('shared_resources')
          .select('id')
          .eq('body_id', bodyId);

        const resourceIds = bodyResources?.map((r) => r.id) || [];
        
        if (resourceIds.length > 0) {
          query = query.in('resource_id', resourceIds);
        } else {
          return { success: true, requests: [] };
        }
      } else {
        // Requests made by this body
        query = query.eq('requesting_body_id', bodyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, requests: data || [] };
    } catch (error) {
      console.error('Error getting resource requests:', error);
      return { success: false, error: error.message, requests: [] };
    }
  },

  /**
   * Update resource request status
   */
  updateRequestStatus: async (requestId, status, approvalNotes = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData = {
        status,
        approval_notes: approvalNotes,
      };

      if (status === 'approved') {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('resource_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, request: data };
    } catch (error) {
      console.error('Error updating request status:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // BODY MESSAGES
  // ============================================================================

  /**
   * Send body-to-body message
   */
  sendMessage: async (senderBodyId, receiverBodyId, messageData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_messages')
        .insert({
          sender_body_id: senderBodyId,
          receiver_body_id: receiverBodyId,
          sender_member_id: user.id,
          subject: messageData.subject,
          message: messageData.message,
          message_type: messageData.messageType || 'general',
          priority: messageData.priority || 'normal',
          related_id: messageData.relatedId,
          related_type: messageData.relatedType,
          attachments: messageData.attachments,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get body messages
   */
  getMessages: async (bodyId, type = 'all', filters = {}) => {
    try {
      let query = supabase
        .from('body_messages')
        .select(`
          *,
          sender_body:bodies!body_messages_sender_body_id_fkey(id, name, logo_url),
          receiver_body:bodies!body_messages_receiver_body_id_fkey(id, name, logo_url),
          sender_member:members!body_messages_sender_member_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (type === 'inbox') {
        query = query.eq('receiver_body_id', bodyId);
      } else if (type === 'sent') {
        query = query.eq('sender_body_id', bodyId);
      } else {
        query = query.or(`sender_body_id.eq.${bodyId},receiver_body_id.eq.${bodyId}`);
      }

      if (filters.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      if (filters.messageType) {
        query = query.eq('message_type', filters.messageType);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, messages: data || [] };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message, messages: [] };
    }
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (bodyId) => {
    try {
      const { count, error } = await supabase
        .from('body_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_body_id', bodyId)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: true, count: 0 };
    }
  },

  /**
   * Mark message as read
   */
  markMessageAsRead: async (messageId) => {
    try {
      const { error } = await supabase
        .from('body_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all messages as read
   */
  markAllAsRead: async (bodyId) => {
    try {
      const { error } = await supabase
        .from('body_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('receiver_body_id', bodyId)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete message
   */
  deleteMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from('body_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // BODY NETWORK (FOLLOWING/FOLLOWERS)
  // ============================================================================

  /**
   * Follow another body
   */
  followBody: async (followerBodyId, followingBodyId) => {
    try {
      const { data, error } = await supabase
        .from('body_connections')
        .insert({
          follower_body_id: followerBodyId,
          following_body_id: followingBodyId,
          connection_type: 'follow',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, connection: data };
    } catch (error) {
      console.error('Error following body:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Unfollow body
   */
  unfollowBody: async (followerBodyId, followingBodyId) => {
    try {
      const { error } = await supabase
        .from('body_connections')
        .delete()
        .eq('follower_body_id', followerBodyId)
        .eq('following_body_id', followingBodyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unfollowing body:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if following
   */
  isFollowing: async (followerBodyId, followingBodyId) => {
    try {
      const { data, error } = await supabase
        .from('body_connections')
        .select('id')
        .eq('follower_body_id', followerBodyId)
        .eq('following_body_id', followingBodyId)
        .single();

      return { success: true, isFollowing: !!data };
    } catch (error) {
      return { success: true, isFollowing: false };
    }
  },

  /**
   * Get body network (following/followers)
   */
  getBodyNetwork: async (bodyId, type = 'following') => {
    try {
      let query = supabase
        .from('body_connections')
        .select(`
          *,
          follower:bodies!body_connections_follower_body_id_fkey(
            id, 
            name, 
            logo_url, 
            body_type,
            city,
            country
          ),
          following:bodies!body_connections_following_body_id_fkey(
            id, 
            name, 
            logo_url, 
            body_type,
            city,
            country
          )
        `)
        .order('created_at', { ascending: false });

      if (type === 'following') {
        query = query.eq('follower_body_id', bodyId);
      } else {
        query = query.eq('following_body_id', bodyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, connections: data || [] };
    } catch (error) {
      console.error('Error getting body network:', error);
      return { success: false, error: error.message, connections: [] };
    }
  },

  /**
   * Get network statistics
   */
  getNetworkStats: async (bodyId) => {
    try {
      const { count: followingCount } = await supabase
        .from('body_connections')
        .select('*', { count: 'exact', head: true })
        .eq('follower_body_id', bodyId);

      const { count: followersCount } = await supabase
        .from('body_connections')
        .select('*', { count: 'exact', head: true })
        .eq('following_body_id', bodyId);

      return {
        success: true,
        stats: {
          following: followingCount || 0,
          followers: followersCount || 0,
        },
      };
    } catch (error) {
      console.error('Error getting network stats:', error);
      return { success: false, error: error.message };
    }
  },
};
