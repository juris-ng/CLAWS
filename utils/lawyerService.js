import { supabase } from '../supabase';

export const LawyerService = {
  // ==================== LAWYER PROFILES ====================
  
  // Get all verified lawyers
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .select('*')
        .eq('is_verified', true)
        .eq('is_available', true)
        .order('rating', { descending: true });

      if (error) throw error;

      return {
        success: true,
        lawyers: data || [],
      };
    } catch (error) {
      console.error('Error getting lawyers:', error);
      return {
        success: true,
        lawyers: [],
      };
    }
  },

  // Get lawyer by ID
  async getLawyerById(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .select('*')
        .eq('id', lawyerId)
        .single();

      if (error) throw error;

      return {
        success: true,
        lawyer: data,
      };
    } catch (error) {
      console.error('Error getting lawyer:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Search lawyers with filters
  async searchLawyers(filters = {}) {
    try {
      let query = supabase
        .from('lawyers')
        .select('*')
        .eq('is_verified', true);

      if (filters.practiceAreaId) {
        const { data: specializations } = await supabase
          .from('lawyer_specializations')
          .select('lawyer_id')
          .eq('practice_area_id', filters.practiceAreaId);

        if (specializations && specializations.length > 0) {
          const lawyerIds = specializations.map(s => s.lawyer_id);
          query = query.in('id', lawyerIds);
        }
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.maxConsultationFee) {
        query = query.lte('consultation_fee', filters.maxConsultationFee);
      }

      if (filters.isAvailable !== undefined) {
        query = query.eq('is_available', filters.isAvailable);
      }

      const { data, error } = await query.order('rating', { descending: true });

      if (error) throw error;

      return {
        success: true,
        lawyers: data || [],
      };
    } catch (error) {
      console.error('Error searching lawyers:', error);
      return {
        success: true,
        lawyers: [],
      };
    }
  },

  // Update lawyer profile
  async updateLawyerProfile(lawyerId, updates) {
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .update(updates)
        .eq('id', lawyerId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        lawyer: data,
      };
    } catch (error) {
      console.error('Error updating lawyer:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== PRACTICE AREAS & SPECIALIZATIONS ====================
  
  // Get practice areas
  async getPracticeAreas() {
    try {
      const { data, error } = await supabase
        .from('practice_areas')
        .select('*')
        .order('name');

      if (error) throw error;

      return {
        success: true,
        practiceAreas: data || [],
      };
    } catch (error) {
      console.error('Error getting practice areas:', error);
      return {
        success: true,
        practiceAreas: [],
      };
    }
  },

  // Get lawyer specializations
  async getLawyerSpecializations(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_specializations')
        .select(`
          *,
          practice_area:practice_areas(*)
        `)
        .eq('lawyer_id', lawyerId);

      if (error) throw error;

      return {
        success: true,
        specializations: data || [],
      };
    } catch (error) {
      console.error('Error getting specializations:', error);
      return {
        success: true,
        specializations: [],
      };
    }
  },

  // Add lawyer specialization
  async addSpecialization(lawyerId, practiceAreaId, expertiseLevel = 'intermediate') {
    try {
      const { data, error } = await supabase
        .from('lawyer_specializations')
        .insert([
          {
            lawyer_id: lawyerId,
            practice_area_id: practiceAreaId,
            expertise_level: expertiseLevel,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        specialization: data,
      };
    } catch (error) {
      console.error('Error adding specialization:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Remove lawyer specialization
  async removeSpecialization(lawyerId, practiceAreaId) {
    try {
      const { error } = await supabase
        .from('lawyer_specializations')
        .delete()
        .eq('lawyer_id', lawyerId)
        .eq('practice_area_id', practiceAreaId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error removing specialization:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== CREDENTIALS ====================
  
  // Get lawyer credentials
  async getLawyerCredentials(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_credentials')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .eq('verification_status', 'verified')
        .order('issue_date', { descending: true });

      if (error) throw error;

      return {
        success: true,
        credentials: data || [],
      };
    } catch (error) {
      console.error('Error getting credentials:', error);
      return {
        success: true,
        credentials: [],
      };
    }
  },

  // Upload lawyer credential
  async uploadCredential(lawyerId, credentialData) {
    try {
      const { data, error } = await supabase
        .from('lawyer_credentials')
        .insert([
          {
            lawyer_id: lawyerId,
            ...credentialData,
            verification_status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        credential: data,
      };
    } catch (error) {
      console.error('Error uploading credential:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== REVIEWS & RATINGS ====================
  
  // Get lawyer reviews/ratings
  async getLawyerReviews(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_ratings')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .order('created_at', { descending: true })
        .limit(10);

      if (error) throw error;

      return {
        success: true,
        reviews: data || [],
      };
    } catch (error) {
      console.error('Error getting reviews:', error);
      return {
        success: true,
        reviews: [],
      };
    }
  },

  // Submit review for lawyer
  async submitReview(reviewData) {
    try {
      const { data, error } = await supabase
        .from('lawyer_ratings')
        .insert([reviewData])
        .select()
        .single();

      if (error) throw error;

      // Update lawyer's average rating
      await this.updateLawyerRating(reviewData.lawyer_id);

      return {
        success: true,
        review: data,
      };
    } catch (error) {
      console.error('Error submitting review:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Update lawyer's average rating
  async updateLawyerRating(lawyerId) {
    try {
      const { data: reviews } = await supabase
        .from('lawyer_ratings')
        .select('overall_rating')
        .eq('lawyer_id', lawyerId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;
        
        await supabase
          .from('lawyers')
          .update({ rating: avgRating })
          .eq('id', lawyerId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating rating:', error);
      return { success: false };
    }
  },

  // ==================== AVAILABILITY & BOOKING SLOTS ====================
  
  // Get lawyer availability
  async getLawyerAvailability(lawyerId, startDate, endDate) {
    try {
      let query = supabase
        .from('lawyer_availability')
        .select('*')
        .eq('lawyer_id', lawyerId);

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query.order('date');

      if (error) throw error;

      return {
        success: true,
        availability: data || [],
      };
    } catch (error) {
      console.error('Error getting availability:', error);
      return {
        success: true,
        availability: [],
      };
    }
  },

  // Set lawyer availability
  async setAvailability(lawyerId, availabilityData) {
    try {
      const { data, error } = await supabase
        .from('lawyer_availability')
        .insert([
          {
            lawyer_id: lawyerId,
            ...availabilityData,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        availability: data,
      };
    } catch (error) {
      console.error('Error setting availability:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get booking slots
  async getBookingSlots(lawyerId, date) {
    try {
      const { data, error } = await supabase
        .from('lawyer_booking_slots')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .eq('date', date)
        .eq('is_available', true)
        .order('start_time');

      if (error) throw error;

      return {
        success: true,
        slots: data || [],
      };
    } catch (error) {
      console.error('Error getting booking slots:', error);
      return {
        success: true,
        slots: [],
      };
    }
  },

  // ==================== CONSULTATIONS ====================
  
  // Get lawyer consultations
  async getLawyerConsultations(lawyerId, status = null) {
    try {
      let query = supabase
        .from('consultation_bookings')
        .select('*')
        .eq('lawyer_id', lawyerId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('consultation_date', { descending: true });

      if (error) throw error;

      return {
        success: true,
        consultations: data || [],
      };
    } catch (error) {
      console.error('Error getting consultations:', error);
      return {
        success: true,
        consultations: [],
      };
    }
  },

  // Book consultation
  async bookConsultation(bookingData) {
    try {
      const { data, error } = await supabase
        .from('consultation_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        booking: data,
      };
    } catch (error) {
      console.error('Error booking consultation:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Update consultation status
  async updateConsultationStatus(bookingId, status, notes = null) {
    try {
      const updates = { status };
      if (notes) updates.notes = notes;

      const { data, error } = await supabase
        .from('consultation_bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        booking: data,
      };
    } catch (error) {
      console.error('Error updating consultation:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== LEGAL CASES ====================
  
  // Get lawyer cases
  async getLawyerCases(lawyerId, status = null) {
    try {
      let query = supabase
        .from('legal_cases')
        .select('*')
        .eq('lawyer_id', lawyerId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        cases: data || [],
      };
    } catch (error) {
      console.error('Error getting cases:', error);
      return {
        success: true,
        cases: [],
      };
    }
  },

  // ==================== LEGAL Q&A ====================
  
  // Get Q&A requests for lawyer
  async getQnARequests(lawyerId, status = null) {
    try {
      let query = supabase
        .from('legal_advice_requests')
        .select('*')
        .eq('lawyer_id', lawyerId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        requests: data || [],
      };
    } catch (error) {
      console.error('Error getting Q&A requests:', error);
      return {
        success: true,
        requests: [],
      };
    }
  },

  // Answer Q&A request
  async answerQnA(requestId, answer) {
    try {
      const { data, error } = await supabase
        .from('legal_advice_requests')
        .update({
          answer,
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        request: data,
      };
    } catch (error) {
      console.error('Error answering Q&A:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== FEE QUOTES ====================
  
  // Get fee quotes
  async getFeeQuotes(lawyerId, status = null) {
    try {
      let query = supabase
        .from('lawyer_fee_quotes')
        .select('*')
        .eq('lawyer_id', lawyerId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        quotes: data || [],
      };
    } catch (error) {
      console.error('Error getting fee quotes:', error);
      return {
        success: true,
        quotes: [],
      };
    }
  },

  // Send fee quote
  async sendFeeQuote(quoteData) {
    try {
      const { data, error } = await supabase
        .from('lawyer_fee_quotes')
        .insert([quoteData])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        quote: data,
      };
    } catch (error) {
      console.error('Error sending fee quote:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Update quote status
  async updateQuoteStatus(quoteId, status) {
    try {
      const { data, error } = await supabase
        .from('lawyer_fee_quotes')
        .update({ status })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        quote: data,
      };
    } catch (error) {
      console.error('Error updating quote:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== STATISTICS & ANALYTICS ====================
  
  // Get lawyer statistics
  async getLawyerStats(lawyerId) {
    try {
      const [casesResult, consultationsResult, reviewsResult] = await Promise.all([
        supabase
          .from('legal_cases')
          .select('id, status')
          .eq('lawyer_id', lawyerId),
        supabase
          .from('consultation_bookings')
          .select('id, status')
          .eq('lawyer_id', lawyerId),
        supabase
          .from('lawyer_ratings')
          .select('overall_rating')
          .eq('lawyer_id', lawyerId),
      ]);

      const cases = casesResult.data || [];
      const consultations = consultationsResult.data || [];
      const reviews = reviewsResult.data || [];

      const stats = {
        totalCases: cases.length,
        activeCases: cases.filter(c => c.status === 'active').length,
        totalConsultations: consultations.length,
        upcomingConsultations: consultations.filter(c => c.status === 'confirmed').length,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
          : 0,
      };

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Error getting lawyer stats:', error);
      return {
        success: true,
        stats: {
          totalCases: 0,
          activeCases: 0,
          totalConsultations: 0,
          upcomingConsultations: 0,
          totalReviews: 0,
          averageRating: 0,
        },
      };
    }
  },

  // Get performance metrics
  async getPerformanceMetrics(lawyerId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('lawyer_performance_metrics')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { descending: true });

      if (error) throw error;

      return {
        success: true,
        metrics: data || [],
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        success: true,
        metrics: [],
      };
    }
  },

  // Get specialization analytics
  async getSpecializationAnalytics(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_specialization_analytics')
        .select('*')
        .eq('lawyer_id', lawyerId);

      if (error) throw error;

      return {
        success: true,
        analytics: data || [],
      };
    } catch (error) {
      console.error('Error getting specialization analytics:', error);
      return {
        success: true,
        analytics: [],
      };
    }
  },

  // Get revenue tracking
  async getRevenueTracking(lawyerId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('lawyer_revenue_tracking')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { descending: true });

      if (error) throw error;

      return {
        success: true,
        revenue: data || [],
      };
    } catch (error) {
      console.error('Error getting revenue tracking:', error);
      return {
        success: true,
        revenue: [],
      };
    }
  },

  // Get client satisfaction metrics
  async getClientSatisfaction(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_client_satisfaction')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .order('created_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        satisfaction: data || [],
      };
    } catch (error) {
      console.error('Error getting client satisfaction:', error);
      return {
        success: true,
        satisfaction: [],
      };
    }
  },

  // ==================== ACHIEVEMENT BADGES ====================
  
  // Get lawyer badges
  async getLawyerBadges(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_earned_badges')
        .select(`
          *,
          badge:lawyer_achievement_badges(*)
        `)
        .eq('lawyer_id', lawyerId)
        .order('earned_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        badges: data || [],
      };
    } catch (error) {
      console.error('Error getting badges:', error);
      return {
        success: true,
        badges: [],
      };
    }
  },

  // Check and award badges
  async checkAndAwardBadges(lawyerId) {
    try {
      // Get lawyer stats
      const statsResult = await this.getLawyerStats(lawyerId);
      const stats = statsResult.stats;

      // Get all badge criteria
      const { data: badges } = await supabase
        .from('lawyer_achievement_badges')
        .select('*');

      // Check each badge criteria
      for (const badge of badges || []) {
        const criteria = badge.criteria;
        let qualifies = false;

        // Example criteria checks
        if (badge.type === 'cases_won' && stats.totalCases >= criteria.min_cases) {
          qualifies = true;
        } else if (badge.type === 'consultations' && stats.totalConsultations >= criteria.min_consultations) {
          qualifies = true;
        } else if (badge.type === 'rating' && stats.averageRating >= criteria.min_rating) {
          qualifies = true;
        }

        if (qualifies) {
          // Award badge if not already earned
          const { data: existing } = await supabase
            .from('lawyer_earned_badges')
            .select('id')
            .eq('lawyer_id', lawyerId)
            .eq('badge_id', badge.id)
            .single();

          if (!existing) {
            await supabase
              .from('lawyer_earned_badges')
              .insert([
                {
                  lawyer_id: lawyerId,
                  badge_id: badge.id,
                  earned_at: new Date().toISOString(),
                },
              ]);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error checking badges:', error);
      return { success: false };
    }
  },

  // ==================== DOCUMENT TEMPLATES ====================
  
  // Get document templates
  async getDocumentTemplates(practiceAreaId = null) {
    try {
      let query = supabase
        .from('legal_document_templates')
        .select('*')
        .eq('is_active', true);

      if (practiceAreaId) {
        query = query.eq('practice_area_id', practiceAreaId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      return {
        success: true,
        templates: data || [],
      };
    } catch (error) {
      console.error('Error getting templates:', error);
      return {
        success: true,
        templates: [],
      };
    }
  },

  // Get template by ID
  async getTemplateById(templateId) {
    try {
      const { data, error } = await supabase
        .from('legal_document_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      return {
        success: true,
        template: data,
      };
    } catch (error) {
      console.error('Error getting template:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== MESSAGING ====================
  
  // Get lawyer conversations
  async getLawyerConversations(lawyerId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_client_conversations')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .order('last_message_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        conversations: data || [],
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        success: true,
        conversations: [],
      };
    }
  },

  // Get conversation messages
  async getConversationMessages(conversationId) {
    try {
      const { data, error } = await supabase
        .from('lawyer_client_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        messages: data || [],
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      return {
        success: true,
        messages: [],
      };
    }
  },

  // Send message
  async sendMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('lawyer_client_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('lawyer_client_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', messageData.conversation_id);

      return {
        success: true,
        message: data,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
