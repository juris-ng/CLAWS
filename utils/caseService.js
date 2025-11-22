import { supabase } from '../supabase';

export const CaseService = {
  // ==================== CASE CREATION & MANAGEMENT ====================
  
  // Create a new legal case
  async createCase(caseData) {
    try {
      // Generate case number automatically
      const caseNumber = await this.generateCaseNumber(caseData.practice_area_id);
      
      const { data, error } = await supabase
        .from('legal_cases')
        .insert([
          {
            ...caseData,
            case_number: caseNumber,
            status: 'open',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        case: data,
      };
    } catch (error) {
      console.error('Error creating case:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Generate auto-incremented case number
  async generateCaseNumber(practiceAreaId) {
    try {
      // Get practice area code
      const { data: practiceArea } = await supabase
        .from('practice_areas')
        .select('code')
        .eq('id', practiceAreaId)
        .single();

      const areaCode = practiceArea?.code || 'GEN';
      const year = new Date().getFullYear();
      
      // Count cases for this practice area this year
      const { data: cases } = await supabase
        .from('legal_cases')
        .select('id')
        .eq('practice_area_id', practiceAreaId)
        .gte('created_at', `${year}-01-01`)
        .lte('created_at', `${year}-12-31`);

      const count = (cases?.length || 0) + 1;
      const caseNumber = `${areaCode}-${year}-${String(count).padStart(4, '0')}`;

      return caseNumber;
    } catch (error) {
      console.error('Error generating case number:', error);
      return `CASE-${Date.now()}`;
    }
  },

  // Get case by ID
  async getCaseById(caseId) {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select(`
          *,
          practice_area:practice_areas(*),
          lawyer:lawyers(*),
          client:members(*)
        `)
        .eq('id', caseId)
        .single();

      if (error) throw error;

      return {
        success: true,
        case: data,
      };
    } catch (error) {
      console.error('Error getting case:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get all cases (with filters)
  async getCases(filters = {}) {
    try {
      let query = supabase
        .from('legal_cases')
        .select(`
          *,
          practice_area:practice_areas(*),
          lawyer:lawyers(*),
          client:members(*)
        `);

      // Apply filters
      if (filters.lawyerId) {
        query = query.eq('lawyer_id', filters.lawyerId);
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.practiceAreaId) {
        query = query.eq('practice_area_id', filters.practiceAreaId);
      }

      if (filters.urgency) {
        query = query.eq('urgency_level', filters.urgency);
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

  // Update case
  async updateCase(caseId, updates) {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        case: data,
      };
    } catch (error) {
      console.error('Error updating case:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Update case status
  async updateCaseStatus(caseId, status, notes = null) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('legal_cases')
        .update(updates)
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      // Add timeline event
      if (notes) {
        await this.addTimelineEvent(caseId, {
          event_type: 'status_change',
          title: `Status changed to ${status}`,
          description: notes,
        });
      }

      return {
        success: true,
        case: data,
      };
    } catch (error) {
      console.error('Error updating case status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Delete case
  async deleteCase(caseId) {
    try {
      const { error } = await supabase
        .from('legal_cases')
        .delete()
        .eq('id', caseId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting case:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== CASE DOCUMENTS ====================
  
  // Upload case document
  async uploadDocument(caseId, documentData) {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .insert([
          {
            case_id: caseId,
            ...documentData,
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add timeline event
      await this.addTimelineEvent(caseId, {
        event_type: 'document_upload',
        title: 'Document uploaded',
        description: `${documentData.name} was uploaded`,
      });

      return {
        success: true,
        document: data,
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get case documents
  async getCaseDocuments(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('uploaded_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        documents: data || [],
      };
    } catch (error) {
      console.error('Error getting documents:', error);
      return {
        success: true,
        documents: [],
      };
    }
  },

  // Delete document
  async deleteDocument(documentId) {
    try {
      const { error } = await supabase
        .from('case_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== CASE NOTES ====================
  
  // Add case note
  async addNote(caseId, noteData) {
    try {
      const { data, error } = await supabase
        .from('case_notes')
        .insert([
          {
            case_id: caseId,
            ...noteData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        note: data,
      };
    } catch (error) {
      console.error('Error adding note:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get case notes
  async getCaseNotes(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_notes')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { descending: true });

      if (error) throw error;

      return {
        success: true,
        notes: data || [],
      };
    } catch (error) {
      console.error('Error getting notes:', error);
      return {
        success: true,
        notes: [],
      };
    }
  },

  // Update note
  async updateNote(noteId, content) {
    try {
      const { data, error } = await supabase
        .from('case_notes')
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        note: data,
      };
    } catch (error) {
      console.error('Error updating note:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Delete note
  async deleteNote(noteId) {
    try {
      const { error } = await supabase
        .from('case_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting note:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== CASE TIMELINE ====================
  
  // Add timeline event
  async addTimelineEvent(caseId, eventData) {
    try {
      const { data, error } = await supabase
        .from('case_timeline')
        .insert([
          {
            case_id: caseId,
            ...eventData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        event: data,
      };
    } catch (error) {
      console.error('Error adding timeline event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get case timeline
  async getCaseTimeline(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_timeline')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        timeline: data || [],
      };
    } catch (error) {
      console.error('Error getting timeline:', error);
      return {
        success: true,
        timeline: [],
      };
    }
  },

  // ==================== COURT DATES ====================
  
  // Add court date
  async addCourtDate(caseId, courtDateData) {
    try {
      const { data, error } = await supabase
        .from('case_court_dates')
        .insert([
          {
            case_id: caseId,
            ...courtDateData,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add timeline event
      await this.addTimelineEvent(caseId, {
        event_type: 'court_date',
        title: 'Court date scheduled',
        description: `Court hearing on ${courtDateData.hearing_date}`,
        event_date: courtDateData.hearing_date,
      });

      return {
        success: true,
        courtDate: data,
      };
    } catch (error) {
      console.error('Error adding court date:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get court dates for case
  async getCourtDates(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_court_dates')
        .select('*')
        .eq('case_id', caseId)
        .order('hearing_date', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        courtDates: data || [],
      };
    } catch (error) {
      console.error('Error getting court dates:', error);
      return {
        success: true,
        courtDates: [],
      };
    }
  },

  // Update court date
  async updateCourtDate(courtDateId, updates) {
    try {
      const { data, error } = await supabase
        .from('case_court_dates')
        .update(updates)
        .eq('id', courtDateId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        courtDate: data,
      };
    } catch (error) {
      console.error('Error updating court date:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Delete court date
  async deleteCourtDate(courtDateId) {
    try {
      const { error } = await supabase
        .from('case_court_dates')
        .delete()
        .eq('id', courtDateId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting court date:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== CASE PARTICIPANTS ====================
  
  // Add case participant
  async addParticipant(caseId, participantData) {
    try {
      const { data, error } = await supabase
        .from('case_participants')
        .insert([
          {
            case_id: caseId,
            ...participantData,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add timeline event
      await this.addTimelineEvent(caseId, {
        event_type: 'participant_added',
        title: `${participantData.role} added`,
        description: `${participantData.name} added as ${participantData.role}`,
      });

      return {
        success: true,
        participant: data,
      };
    } catch (error) {
      console.error('Error adding participant:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get case participants
  async getCaseParticipants(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_participants')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        participants: data || [],
      };
    } catch (error) {
      console.error('Error getting participants:', error);
      return {
        success: true,
        participants: [],
      };
    }
  },

  // Update participant
  async updateParticipant(participantId, updates) {
    try {
      const { data, error } = await supabase
        .from('case_participants')
        .update(updates)
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        participant: data,
      };
    } catch (error) {
      console.error('Error updating participant:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Remove participant
  async removeParticipant(participantId) {
    try {
      const { error } = await supabase
        .from('case_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error removing participant:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ==================== CASE PAYMENTS ====================
  
  // Add payment record
  async addPayment(caseId, paymentData) {
    try {
      const { data, error } = await supabase
        .from('case_payments')
        .insert([
          {
            case_id: caseId,
            ...paymentData,
            payment_date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add timeline event
      await this.addTimelineEvent(caseId, {
        event_type: 'payment',
        title: 'Payment received',
        description: `Payment of ${paymentData.amount} ${paymentData.currency || 'USD'}`,
      });

      return {
        success: true,
        payment: data,
      };
    } catch (error) {
      console.error('Error adding payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get case payments
  async getCasePayments(caseId) {
    try {
      const { data, error } = await supabase
        .from('case_payments')
        .select('*')
        .eq('case_id', caseId)
        .order('payment_date', { descending: true });

      if (error) throw error;

      return {
        success: true,
        payments: data || [],
      };
    } catch (error) {
      console.error('Error getting payments:', error);
      return {
        success: true,
        payments: [],
      };
    }
  },

  // Update payment
  async updatePayment(paymentId, updates) {
    try {
      const { data, error } = await supabase
        .from('case_payments')
        .update(updates)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        payment: data,
      };
    } catch (error) {
      console.error('Error updating payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get payment summary
  async getPaymentSummary(caseId) {
    try {
      const { data: payments } = await supabase
        .from('case_payments')
        .select('amount, status')
        .eq('case_id', caseId);

      const totalPaid = payments
        ?.filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const totalPending = payments
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        success: true,
        summary: {
          totalPaid,
          totalPending,
          totalPayments: payments?.length || 0,
        },
      };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      return {
        success: true,
        summary: {
          totalPaid: 0,
          totalPending: 0,
          totalPayments: 0,
        },
      };
    }
  },

  // ==================== CASE STATISTICS ====================
  
  // Get case statistics
  async getCaseStats(lawyerId = null) {
    try {
      let query = supabase
        .from('legal_cases')
        .select('id, status, urgency_level, created_at');

      if (lawyerId) {
        query = query.eq('lawyer_id', lawyerId);
      }

      const { data: cases } = await query;

      const stats = {
        totalCases: cases?.length || 0,
        openCases: cases?.filter(c => c.status === 'open').length || 0,
        activeCases: cases?.filter(c => c.status === 'active').length || 0,
        closedCases: cases?.filter(c => c.status === 'closed').length || 0,
        urgentCases: cases?.filter(c => c.urgency_level === 'high').length || 0,
        casesThisMonth: cases?.filter(c => {
          const caseDate = new Date(c.created_at);
          const now = new Date();
          return caseDate.getMonth() === now.getMonth() && 
                 caseDate.getFullYear() === now.getFullYear();
        }).length || 0,
      };

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Error getting case stats:', error);
      return {
        success: true,
        stats: {
          totalCases: 0,
          openCases: 0,
          activeCases: 0,
          closedCases: 0,
          urgentCases: 0,
          casesThisMonth: 0,
        },
      };
    }
  },
};
