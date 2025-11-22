import { supabase } from '../supabase';

export const ConsultationService = {
  // ==================== CONSULTATION BOOKING ====================
  
  /**
   * Book a consultation
   */
  bookConsultation: async (bookingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('consultation_bookings')
        .insert({
          client_id: user.id,
          lawyer_id: bookingData.lawyerId,
          case_id: bookingData.caseId,
          booking_type: bookingData.bookingType, // phone, video, in-person
          consultation_date: bookingData.consultationDate,
          duration_minutes: bookingData.durationMinutes || 60,
          meeting_location: bookingData.meetingLocation,
          meeting_link: bookingData.meetingLink, // For video calls
          client_notes: bookingData.clientNotes,
          fee_amount: bookingData.feeAmount,
          status: 'pending', // pending → confirmed → completed/cancelled
        })
        .select()
        .single();

      if (error) throw error;

      // Mark slot as unavailable
      if (bookingData.slotId) {
        await supabase
          .from('lawyer_booking_slots')
          .update({ is_available: false, booking_id: data.id })
          .eq('id', bookingData.slotId);
      }

      return { success: true, booking: data };
    } catch (error) {
      console.error('Error booking consultation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reschedule consultation
   */
  rescheduleConsultation: async (bookingId, newDate, newSlotId = null) => {
    try {
      // Get current booking
      const { data: currentBooking } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      // Update booking
      const { data, error } = await supabase
        .from('consultation_bookings')
        .update({
          consultation_date: newDate,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Free old slot if exists
      if (currentBooking?.slot_id) {
        await supabase
          .from('lawyer_booking_slots')
          .update({ is_available: true, booking_id: null })
          .eq('id', currentBooking.slot_id);
      }

      // Mark new slot as unavailable
      if (newSlotId) {
        await supabase
          .from('lawyer_booking_slots')
          .update({ is_available: false, booking_id: bookingId })
          .eq('id', newSlotId);
      }

      return { success: true, booking: data };
    } catch (error) {
      console.error('Error rescheduling consultation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Confirm consultation (by lawyer)
   */
  confirmConsultation: async (bookingId, confirmationNotes = null) => {
    try {
      const updates = {
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      };

      if (confirmationNotes) {
        updates.lawyer_notes = confirmationNotes;
      }

      const { data, error } = await supabase
        .from('consultation_bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error confirming consultation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Complete consultation
   */
  completeConsultation: async (bookingId, completionData = {}) => {
    try {
      const { data, error } = await supabase
        .from('consultation_bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          lawyer_notes: completionData.lawyerNotes,
          outcome: completionData.outcome,
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error completing consultation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's consultations
   */
  getMyConsultations: async (status = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('consultation_bookings')
        .select(`
          *,
          lawyer:lawyers!consultation_bookings_lawyer_id_fkey(
            id,
            full_name,
            email,
            phone_number,
            law_firm,
            office_phone,
            rating
          ),
          case:legal_cases(case_number, case_title)
        `)
        .eq('client_id', user.id)
        .order('consultation_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, consultations: data || [] };
    } catch (error) {
      console.error('Error getting consultations:', error);
      return { success: false, error: error.message, consultations: [] };
    }
  },

  /**
   * Get lawyer's consultations
   */
  getLawyerConsultations: async (lawyerId, status = null) => {
    try {
      let query = supabase
        .from('consultation_bookings')
        .select(`
          *,
          client:members!consultation_bookings_client_id_fkey(
            id,
            full_name,
            email,
            phone_number,
            profile_image
          ),
          case:legal_cases(case_number, case_title)
        `)
        .eq('lawyer_id', lawyerId)
        .order('consultation_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, consultations: data || [] };
    } catch (error) {
      console.error('Error getting lawyer consultations:', error);
      return { success: false, error: error.message, consultations: [] };
    }
  },

  /**
   * Get upcoming consultations
   */
  getUpcomingConsultations: async (lawyerId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      let query = supabase
        .from('consultation_bookings')
        .select(`
          *,
          lawyer:lawyers!consultation_bookings_lawyer_id_fkey(full_name, phone_number),
          client:members!consultation_bookings_client_id_fkey(full_name, phone_number)
        `)
        .gte('consultation_date', now)
        .in('status', ['pending', 'confirmed'])
        .order('consultation_date', { ascending: true });

      if (lawyerId) {
        query = query.eq('lawyer_id', lawyerId);
      } else {
        query = query.eq('client_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, consultations: data || [] };
    } catch (error) {
      console.error('Error getting upcoming consultations:', error);
      return { success: false, error: error.message, consultations: [] };
    }
  },

  /**
   * Update consultation
   */
  updateConsultation: async (bookingId, updates) => {
    try {
      const { data, error } = await supabase
        .from('consultation_bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error updating consultation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancel consultation
   */
  cancelConsultation: async (bookingId, reason) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get booking to free the slot
      const { data: booking } = await supabase
        .from('consultation_bookings')
        .select('slot_id')
        .eq('id', bookingId)
        .single();

      const result = await this.updateConsultation(bookingId, {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
      });

      // Free the slot
      if (booking?.slot_id) {
        await supabase
          .from('lawyer_booking_slots')
          .update({ is_available: true, booking_id: null })
          .eq('id', booking.slot_id);
      }

      return result;
    } catch (error) {
      console.error('Error cancelling consultation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Rate consultation
   */
  rateConsultation: async (bookingId, ratingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update booking with rating
      await this.updateConsultation(bookingId, {
        client_rating: ratingData.rating,
        client_feedback: ratingData.feedback,
      });

      // Get lawyer ID from booking
      const { data: booking } = await supabase
        .from('consultation_bookings')
        .select('lawyer_id')
        .eq('id', bookingId)
        .single();

      // Create lawyer rating record
      const { data, error } = await supabase
        .from('lawyer_ratings')
        .insert({
          lawyer_id: booking.lawyer_id,
          client_id: user.id,
          booking_id: bookingId,
          overall_rating: ratingData.rating,
          professionalism: ratingData.professionalism || ratingData.rating,
          communication: ratingData.communication || ratingData.rating,
          expertise: ratingData.expertise || ratingData.rating,
          value_for_money: ratingData.valueForMoney || ratingData.rating,
          review_text: ratingData.feedback,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, rating: data };
    } catch (error) {
      console.error('Error rating consultation:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== BOOKING SLOTS MANAGEMENT ====================
  
  /**
   * Get available booking slots
   */
  getAvailableSlots: async (lawyerId, date) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_booking_slots')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .eq('slot_date', date)
        .eq('is_available', true)
        .order('start_time');

      if (error) throw error;
      return { success: true, slots: data || [] };
    } catch (error) {
      console.error('Error getting available slots:', error);
      return { success: false, error: error.message, slots: [] };
    }
  },

  /**
   * Create booking slot (lawyer)
   */
  createSlot: async (lawyerId, slotData) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_booking_slots')
        .insert({
          lawyer_id: lawyerId,
          slot_date: slotData.date,
          start_time: slotData.startTime,
          end_time: slotData.endTime,
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, slot: data };
    } catch (error) {
      console.error('Error creating slot:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete booking slot
   */
  deleteSlot: async (slotId) => {
    try {
      const { error } = await supabase
        .from('lawyer_booking_slots')
        .delete()
        .eq('id', slotId)
        .eq('is_available', true); // Only delete if not booked

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting slot:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== LEGAL ADVICE Q&A ====================
  
  /**
   * Submit legal advice request
   */
  submitAdviceRequest: async (adviceData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('legal_advice_requests')
        .insert({
          client_id: user.id,
          practice_area_id: adviceData.practiceAreaId,
          question_title: adviceData.questionTitle,
          question_text: adviceData.questionText,
          question_type: adviceData.questionType || 'general',
          is_public: adviceData.isPublic || false,
          attachments: adviceData.attachments,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, request: data };
    } catch (error) {
      console.error('Error submitting advice request:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get advice requests (for client)
   */
  getAdviceRequests: async (status = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('legal_advice_requests')
        .select(`
          *,
          practice_area:practice_areas(name, icon),
          lawyer:lawyers!legal_advice_requests_lawyer_id_fkey(full_name, rating)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, requests: data || [] };
    } catch (error) {
      console.error('Error getting advice requests:', error);
      return { success: false, error: error.message, requests: [] };
    }
  },

  /**
   * Get public Q&A (knowledge base)
   */
  getPublicQnA: async (practiceAreaId = null, limit = 20) => {
    try {
      let query = supabase
        .from('legal_advice_requests')
        .select(`
          *,
          practice_area:practice_areas(name, icon),
          lawyer:lawyers!legal_advice_requests_lawyer_id_fkey(full_name, rating)
        `)
        .eq('is_public', true)
        .eq('status', 'answered')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (practiceAreaId) {
        query = query.eq('practice_area_id', practiceAreaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, questions: data || [] };
    } catch (error) {
      console.error('Error getting public Q&A:', error);
      return { success: false, error: error.message, questions: [] };
    }
  },

  /**
   * Search public Q&A
   */
  searchPublicQnA: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .from('legal_advice_requests')
        .select(`
          *,
          practice_area:practice_areas(name),
          lawyer:lawyers!legal_advice_requests_lawyer_id_fkey(full_name)
        `)
        .eq('is_public', true)
        .eq('status', 'answered')
        .or(`question_title.ilike.%${searchTerm}%,question_text.ilike.%${searchTerm}%,answer_text.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return { success: true, questions: data || [] };
    } catch (error) {
      console.error('Error searching Q&A:', error);
      return { success: false, error: error.message, questions: [] };
    }
  },

  // ==================== MESSAGING ====================
  
  /**
   * Get conversation with lawyer
   */
  getConversation: async (lawyerId, caseId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('lawyer_client_conversations')
        .select('*')
        .eq('client_id', user.id)
        .eq('lawyer_id', lawyerId);

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, conversation: data };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create or get conversation
   */
  createConversation: async (lawyerId, caseId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const conversationData = {
        client_id: user.id,
        lawyer_id: lawyerId,
        case_id: caseId,
        last_message_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('lawyer_client_conversations')
        .upsert(conversationData, {
          onConflict: 'client_id,lawyer_id,case_id',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, conversation: data };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get messages in conversation
   */
  getMessages: async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_client_messages')
        .select(`
          *,
          sender:members!lawyer_client_messages_sender_id_fkey(full_name, profile_image)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, messages: data || [] };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message, messages: [] };
    }
  },

  /**
   * Send message
   */
  sendMessage: async (conversationId, receiverId, messageText, attachments = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('lawyer_client_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: messageText,
          attachments,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('lawyer_client_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, message: data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark message as read
   */
  markAsRead: async (messageId) => {
    try {
      const { error } = await supabase
        .from('lawyer_client_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== FEE QUOTES ====================
  
  /**
   * Request fee quote
   */
  requestFeeQuote: async (lawyerId, quoteData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('lawyer_fee_quotes')
        .insert({
          lawyer_id: lawyerId,
          client_id: user.id,
          case_id: quoteData.caseId,
          service_description: quoteData.serviceDescription,
          fee_type: quoteData.feeType,
          estimated_hours: quoteData.estimatedHours,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, quote: data };
    } catch (error) {
      console.error('Error requesting fee quote:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get fee quotes
   */
  getFeeQuotes: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('lawyer_fee_quotes')
        .select(`
          *,
          lawyer:lawyers!lawyer_fee_quotes_lawyer_id_fkey(full_name, law_firm, rating),
          case:legal_cases(case_number, case_title)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, quotes: data || [] };
    } catch (error) {
      console.error('Error getting fee quotes:', error);
      return { success: false, error: error.message, quotes: [] };
    }
  },

  /**
   * Accept fee quote
   */
  acceptFeeQuote: async (quoteId) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_fee_quotes')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, quote: data };
    } catch (error) {
      console.error('Error accepting quote:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reject fee quote
   */
  rejectFeeQuote: async (quoteId, reason = null) => {
    try {
      const { data, error } = await supabase
        .from('lawyer_fee_quotes')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, quote: data };
    } catch (error) {
      console.error('Error rejecting quote:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== STATISTICS ====================
  
  /**
   * Get consultation statistics
   */
  getConsultationStats: async (lawyerId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('consultation_bookings')
        .select('id, status, consultation_date');

      if (lawyerId) {
        query = query.eq('lawyer_id', lawyerId);
      } else {
        query = query.eq('client_id', user.id);
      }

      const { data: consultations } = await query;

      const now = new Date();
      const stats = {
        total: consultations?.length || 0,
        pending: consultations?.filter(c => c.status === 'pending').length || 0,
        confirmed: consultations?.filter(c => c.status === 'confirmed').length || 0,
        completed: consultations?.filter(c => c.status === 'completed').length || 0,
        cancelled: consultations?.filter(c => c.status === 'cancelled').length || 0,
        upcoming: consultations?.filter(c => {
          const consultDate = new Date(c.consultation_date);
          return consultDate > now && (c.status === 'pending' || c.status === 'confirmed');
        }).length || 0,
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting consultation stats:', error);
      return { success: false, error: error.message };
    }
  },
};
