import { supabase } from '../supabase';

export const BodyMemberService = {
  /**
   * Send message from member to body
   */
  sendMessageToBody: async (bodyId, messageData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_member_messages')
        .insert({
          body_id: bodyId,
          member_id: user.id,
          sender_type: 'member',
          subject: messageData.subject,
          message: messageData.message,
          message_type: messageData.messageType || 'general',
          related_petition_id: messageData.relatedPetitionId,
          attachments: messageData.attachments
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
   * Send message from body to member
   */
  sendMessageToMember: async (bodyId, memberId, messageData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('body_member_messages')
        .insert({
          body_id: bodyId,
          member_id: memberId,
          sender_type: 'body',
          sender_member_id: user.id,
          subject: messageData.subject,
          message: messageData.message,
          message_type: messageData.messageType || 'general',
          attachments: messageData.attachments
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
   * Get messages for a member
   */
  getMemberMessages: async (bodyId = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('body_member_messages')
        .select(`
          *,
          body:body_profiles(id, name, logo_url),
          sender_member:members!body_member_messages_sender_member_id_fkey(full_name)
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (bodyId) {
        query = query.eq('body_id', bodyId);
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
   * Get messages for a body
   */
  getBodyMessages: async (bodyId) => {
    try {
      const { data, error } = await supabase
        .from('body_member_messages')
        .select(`
          *,
          member:members!body_member_messages_member_id_fkey(id, full_name, email, avatar_url),
          sender_member:members!body_member_messages_sender_member_id_fkey(full_name)
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, messages: data || [] };
    } catch (error) {
      console.error('Error getting body messages:', error);
      return { success: false, error: error.message, messages: [] };
    }
  },

  /**
   * Mark message as read
   */
  markMessageAsRead: async (messageId) => {
    try {
      const { error } = await supabase
        .from('body_member_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
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
   * Create official petition response
   */
  createPetitionResponse: async (bodyId, petitionId, responseData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('official_petition_responses')
        .insert({
          petition_id: petitionId,
          body_id: bodyId,
          responder_member_id: user.id,
          response_status: responseData.responseStatus,
          response_title: responseData.responseTitle,
          response_text: responseData.responseText,
          action_plan: responseData.actionPlan,
          timeline: responseData.timeline,
          expected_completion_date: responseData.expectedCompletionDate,
          budget_allocated: responseData.budgetAllocated,
          attachments: responseData.attachments,
          is_public: responseData.isPublic !== false
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, response: data };
    } catch (error) {
      console.error('Error creating response:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get petition responses
   */
  getPetitionResponses: async (petitionId) => {
    try {
      const { data, error } = await supabase
        .from('official_petition_responses')
        .select(`
          *,
          body:body_profiles(id, name, logo_url),
          responder:members(full_name, avatar_url)
        `)
        .eq('petition_id', petitionId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, responses: data || [] };
    } catch (error) {
      console.error('Error getting responses:', error);
      return { success: false, error: error.message, responses: [] };
    }
  },

  /**
   * Create Q&A session
   */
  createQnASession: async (bodyId, sessionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('qna_sessions')
        .insert({
          body_id: bodyId,
          created_by: user.id,
          title: sessionData.title,
          description: sessionData.description,
          session_type: sessionData.sessionType || 'live',
          scheduled_start: sessionData.scheduledStart,
          scheduled_end: sessionData.scheduledEnd,
          location: sessionData.location,
          max_participants: sessionData.maxParticipants,
          tags: sessionData.tags
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, session: data };
    } catch (error) {
      console.error('Error creating Q&A session:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get Q&A sessions
   */
  getQnASessions: async (bodyId, status = null) => {
    try {
      let query = supabase
        .from('qna_sessions')
        .select(`
          *,
          body:body_profiles(id, name, logo_url),
          creator:members(full_name)
        `)
        .order('scheduled_start', { ascending: false });

      if (bodyId) {
        query = query.eq('body_id', bodyId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, sessions: data || [] };
    } catch (error) {
      console.error('Error getting Q&A sessions:', error);
      return { success: false, error: error.message, sessions: [] };
    }
  },

  /**
   * Submit question to Q&A session
   */
  submitQuestion: async (sessionId, questionText, isAnonymous = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('qna_questions')
        .insert({
          session_id: sessionId,
          member_id: user.id,
          question: questionText,
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, question: data };
    } catch (error) {
      console.error('Error submitting question:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get questions for a session
   */
  getSessionQuestions: async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('qna_questions')
        .select(`
          *,
          member:members(full_name, avatar_url),
          answerer:members!qna_questions_answered_by_fkey(full_name)
        `)
        .eq('session_id', sessionId)
        .order('upvotes_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, questions: data || [] };
    } catch (error) {
      console.error('Error getting questions:', error);
      return { success: false, error: error.message, questions: [] };
    }
  },

  /**
   * Upvote a question
   */
  upvoteQuestion: async (questionId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('qna_question_upvotes')
        .insert({
          question_id: questionId,
          member_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error upvoting question:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Answer a question
   */
  answerQuestion: async (questionId, answerText) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('qna_questions')
        .update({
          status: 'answered',
          answer_text: answerText,
          answered_by: user.id,
          answered_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, question: data };
    } catch (error) {
      console.error('Error answering question:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create survey
   */
  createSurvey: async (bodyId, surveyData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: survey, error: surveyError } = await supabase
        .from('member_surveys')
        .insert({
          body_id: bodyId,
          created_by: user.id,
          title: surveyData.title,
          description: surveyData.description,
          survey_type: surveyData.surveyType || 'feedback',
          target_audience: surveyData.targetAudience || 'all',
          is_anonymous: surveyData.isAnonymous || false,
          start_date: surveyData.startDate,
          end_date: surveyData.endDate,
          status: surveyData.status || 'draft'
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Add questions
      if (surveyData.questions && surveyData.questions.length > 0) {
        const questions = surveyData.questions.map((q, index) => ({
          survey_id: survey.id,
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options,
          is_required: q.isRequired || false,
          order_index: index
        }));

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(questions);

        if (questionsError) throw questionsError;
      }

      return { success: true, survey };
    } catch (error) {
      console.error('Error creating survey:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get surveys
   */
  getSurveys: async (bodyId, status = 'active') => {
    try {
      let query = supabase
        .from('member_surveys')
        .select(`
          *,
          body:body_profiles(id, name, logo_url),
          creator:members(full_name)
        `)
        .order('created_at', { ascending: false });

      if (bodyId) {
        query = query.eq('body_id', bodyId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, surveys: data || [] };
    } catch (error) {
      console.error('Error getting surveys:', error);
      return { success: false, error: error.message, surveys: [] };
    }
  },

  /**
   * Get survey with questions
   */
  getSurveyWithQuestions: async (surveyId) => {
    try {
      const { data: survey, error: surveyError } = await supabase
        .from('member_surveys')
        .select(`
          *,
          body:body_profiles(id, name, logo_url)
        `)
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;

      const { data: questions, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order_index');

      if (questionsError) throw questionsError;

      return { success: true, survey: { ...survey, questions } };
    } catch (error) {
      console.error('Error getting survey:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit survey response
   */
  submitSurveyResponse: async (surveyId, responses, isAnonymous = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          member_id: isAnonymous ? null : user.id,
          responses
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, response: data };
    } catch (error) {
      console.error('Error submitting response:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit feedback
   */
  submitFeedback: async (bodyId, feedbackData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('member_feedback')
        .insert({
          body_id: bodyId,
          member_id: feedbackData.isAnonymous ? null : user.id,
          feedback_type: feedbackData.feedbackType,
          subject: feedbackData.subject,
          description: feedbackData.description,
          is_anonymous: feedbackData.isAnonymous || false,
          urgency: feedbackData.urgency || 'normal'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, feedback: data };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get feedback for a body
   */
  getBodyFeedback: async (bodyId, status = null) => {
    try {
      let query = supabase
        .from('member_feedback')
        .select(`
          *,
          member:members(full_name, email),
          responder:members!member_feedback_responded_by_fkey(full_name)
        `)
        .eq('body_id', bodyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, feedback: data || [] };
    } catch (error) {
      console.error('Error getting feedback:', error);
      return { success: false, error: error.message, feedback: [] };
    }
  },

  /**
   * Respond to feedback
   */
  respondToFeedback: async (feedbackId, responseText) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('member_feedback')
        .update({
          status: 'resolved',
          response_text: responseText,
          responded_by: user.id,
          responded_at: new Date().toISOString()
        })
        .eq('id', feedbackId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, feedback: data };
    } catch (error) {
      console.error('Error responding to feedback:', error);
      return { success: false, error: error.message };
    }
  }
};
