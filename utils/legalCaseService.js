import { supabase } from '../supabase';

export const LegalCaseService = {
  /**
   * Create a new legal case
   */
  createCase: async (caseData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('legal_cases')
        .insert({
          client_id: user.id,
          lawyer_id: caseData.lawyerId || null,
          practice_area_id: caseData.practiceAreaId,
          case_title: caseData.caseTitle,
          case_description: caseData.caseDescription,
          case_type: caseData.caseType,
          urgency_level: caseData.urgencyLevel || 'normal',
          budget: caseData.budget,
          related_petition_id: caseData.relatedPetitionId
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, case: data };
    } catch (error) {
      console.error('Error creating case:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's cases
   */
  getUserCases: async (status = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('legal_cases')
        .select(`
          *,
          lawyer:lawyer_profiles(
            id,
            member:members(full_name, avatar_url),
            law_firm
          ),
          practice_area:practice_areas(name, icon)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, cases: data || [] };
    } catch (error) {
      console.error('Error getting user cases:', error);
      return { success: false, error: error.message, cases: [] };
    }
  },

  /**
   * Get lawyer's cases
   */
  getLawyerCases: async (lawyerId, status = null) => {
    try {
      let query = supabase
        .from('legal_cases')
        .select(`
          *,
          client:members(id, full_name, email, avatar_url),
          practice_area:practice_areas(name, icon)
        `)
        .eq('lawyer_id', lawyerId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, cases: data || [] };
    } catch (error) {
      console.error('Error getting lawyer cases:', error);
      return { success: false, error: error.message, cases: [] };
    }
  },

  /**
   * Get case by ID
   */
  getCaseById: async (caseId) => {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select(`
          *,
          client:members!legal_cases_client_id_fkey(id, full_name, email, avatar_url),
          lawyer:lawyer_profiles(
            id,
            member:members(id, full_name, email, avatar_url),
            law_firm,
            office_phone
          ),
          practice_area:practice_areas(name, icon, description)
        `)
        .eq('id', caseId)
        .single();

      if (error) throw error;
      return { success: true, case: data };
    } catch (error) {
      console.error('Error getting case:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update case
   */
  updateCase: async (caseId, updates) => {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .update(updates)
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      // Add timeline event if status changed
      if (updates.status) {
        await this.addTimelineEvent(caseId, {
          eventType: 'status_change',
          eventTitle: 'Status Updated',
          eventDescription: `Case status changed to ${updates.status}`
        });
      }

      return { success: true, case: data };
    } catch (error) {
      console.error('Error updating case:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Assign lawyer to case
   */
  assignLawyer: async (caseId, lawyerId) => {
    try {
      const result = await this.updateCase(caseId, {
        lawyer_id: lawyerId,
        status: 'accepted'
      });

      if (result.success) {
        await this.addTimelineEvent(caseId, {
          eventType: 'assigned',
          eventTitle: 'Lawyer Assigned',
          eventDescription: 'A lawyer has been assigned to this case'
        });
      }

      return result;
    } catch (error) {
      console.error('Error assigning lawyer:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload case document
   */
  uploadDocument: async (caseId, documentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('case_documents')
        .insert({
          case_id: caseId,
          uploaded_by: user.id,
          document_name: documentData.documentName,
          document_type: documentData.documentType,
          document_url: documentData.documentUrl,
          file_size: documentData.fileSize,
          file_type: documentData.fileType,
          is_confidential: documentData.isConfidential !== false,
          description: documentData.description
        })
        .select()
        .single();

      if (error) throw error;

      await this.addTimelineEvent(caseId, {
        eventType: 'document_filed',
        eventTitle: 'Document Uploaded',
        eventDescription: `${documentData.documentName} uploaded`
      });

      return { success: true, document: data };
    } catch (error) {
      console.error('Error uploading document:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get case documents
   */
  getCaseDocuments: async (caseId) => {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select(`
          *,
          uploader:members(full_name, avatar_url)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, documents: data || [] };
    } catch (error) {
      console.error('Error getting documents:', error);
      return { success: false, error: error.message, documents: [] };
    }
  },

  /**
   * Add case note
   */
  addNote: async (caseId, noteData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('case_notes')
        .insert({
          case_id: caseId,
          author_id: user.id,
          note_type: noteData.noteType || 'general',
          note_text: noteData.noteText,
          is_private: noteData.isPrivate || false,
          attachments: noteData.attachments
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, note: data };
    } catch (error) {
      console.error('Error adding note:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get case notes
   */
  getCaseNotes: async (caseId) => {
    try {
      const { data, error } = await supabase
        .from('case_notes')
        .select(`
          *,
          author:members(full_name, avatar_url)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, notes: data || [] };
    } catch (error) {
      console.error('Error getting notes:', error);
      return { success: false, error: error.message, notes: [] };
    }
  },

  /**
   * Add timeline event
   */
  addTimelineEvent: async (caseId, eventData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('case_timeline')
        .insert({
          case_id: caseId,
          event_type: eventData.eventType,
          event_title: eventData.eventTitle,
          event_description: eventData.eventDescription,
          event_date: eventData.eventDate || new Date().toISOString(),
          created_by: user.id,
          metadata: eventData.metadata
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, event: data };
    } catch (error) {
      console.error('Error adding timeline event:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get case timeline
   */
  getCaseTimeline: async (caseId) => {
    try {
      const { data, error } = await supabase
        .from('case_timeline')
        .select(`
          *,
          creator:members(full_name, avatar_url)
        `)
        .eq('case_id', caseId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return { success: true, timeline: data || [] };
    } catch (error) {
      console.error('Error getting timeline:', error);
      return { success: false, error: error.message, timeline: [] };
    }
  },

  /**
   * Schedule court date
   */
  scheduleCourtDate: async (caseId, courtData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('case_court_dates')
        .insert({
          case_id: caseId,
          court_name: courtData.courtName,
          court_location: courtData.courtLocation,
          hearing_type: courtData.hearingType,
          scheduled_date: courtData.scheduledDate,
          scheduled_end_time: courtData.scheduledEndTime,
          notes: courtData.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await this.addTimelineEvent(caseId, {
        eventType: 'court_date',
        eventTitle: 'Court Date Scheduled',
        eventDescription: `${courtData.hearingType} at ${courtData.courtName}`,
        eventDate: courtData.scheduledDate
      });

      return { success: true, courtDate: data };
    } catch (error) {
      console.error('Error scheduling court date:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get case court dates
   */
  getCaseCourtDates: async (caseId) => {
    try {
      const { data, error } = await supabase
        .from('case_court_dates')
        .select('*')
        .eq('case_id', caseId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return { success: true, courtDates: data || [] };
    } catch (error) {
      console.error('Error getting court dates:', error);
      return { success: false, error: error.message, courtDates: [] };
    }
  },

  /**
   * Add case payment
   */
  addPayment: async (caseId, paymentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('case_payments')
        .insert({
          case_id: caseId,
          payer_id: user.id,
          amount: paymentData.amount,
          currency: paymentData.currency || 'KES',
          payment_type: paymentData.paymentType,
          payment_method: paymentData.paymentMethod,
          payment_status: paymentData.paymentStatus || 'pending',
          transaction_reference: paymentData.transactionReference,
          notes: paymentData.notes
        })
        .select()
        .single();

      if (error) throw error;

      await this.addTimelineEvent(caseId, {
        eventType: 'payment',
        eventTitle: 'Payment Recorded',
        eventDescription: `${paymentData.paymentType}: ${paymentData.currency} ${paymentData.amount}`
      });

      return { success: true, payment: data };
    } catch (error) {
      console.error('Error adding payment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get case payments
   */
  getCasePayments: async (caseId) => {
    try {
      const { data, error } = await supabase
        .from('case_payments')
        .select(`
          *,
          payer:members(full_name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, payments: data || [] };
    } catch (error) {
      console.error('Error getting payments:', error);
      return { success: false, error: error.message, payments: [] };
    }
  }
};
