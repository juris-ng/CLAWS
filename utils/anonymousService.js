import { supabase } from '../supabase';

// ============================================================================
// ANONYMITY LEVELS
// ============================================================================
export const ANONYMITY_LEVELS = {
  NONE: 'none', // Full identity visible
  PARTIAL: 'partial', // Name hidden, but some info visible
  FULL: 'full', // Complete anonymity
  WHISTLEBLOWER: 'whistleblower', // Maximum protection
};

// ============================================================================
// NAME GENERATION
// ============================================================================
const NAME_PREFIXES = [
  'Activist',
  'Citizen',
  'Voice',
  'Guardian',
  'Patriot',
  'Champion',
  'Advocate',
  'Defender',
  'Protector',
  'Warrior',
  'Fighter',
  'Hero',
  'Rebel',
  'Sentinel',
  'Watcher',
  'Keeper',
];

const NAME_SUFFIXES = [
  'Truth',
  'Justice',
  'Freedom',
  'Liberty',
  'Hope',
  'Change',
  'Peace',
  'Unity',
  'Power',
  'Rising',
];

// ============================================================================
// AVATAR COLORS (for anonymous avatars)
// ============================================================================
const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#52B788',
];

// ============================================================================
// ANONYMOUS SERVICE
// ============================================================================
export const AnonymousService = {
  /**
   * Generate a random anonymous display name
   */
  generateAnonymousName: (style = 'default') => {
    if (style === 'simple') {
      // Simple format: Anonymous_1234
      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      return `Anonymous_${randomNumber}`;
    } else if (style === 'descriptive') {
      // Descriptive format: Prefix + Suffix + Number
      const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
      const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
      const randomNumber = Math.floor(100 + Math.random() * 900);
      return `${prefix}Of${suffix}${randomNumber}`;
    } else {
      // Default format: Prefix_Number
      const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
      const randomNumber = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}_${randomNumber}`;
    }
  },

  /**
   * Generate anonymous avatar color
   */
  generateAvatarColor: (userId) => {
    // Use userId to generate consistent color
    const hash = userId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  },

  /**
   * Generate anonymous avatar URL (placeholder)
   */
  generateAvatarUrl: (anonymousName, userId) => {
    const color = AnonymousService.generateAvatarColor(userId).replace('#', '');
    const initial = anonymousName.charAt(0).toUpperCase();
    // Using UI Avatars API for placeholder
    return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=200&bold=true`;
  },

  /**
   * Enable anonymous mode
   */
  enableAnonymousMode: async (memberId, options = {}) => {
    try {
      const {
        anonymityLevel = ANONYMITY_LEVELS.FULL,
        nameStyle = 'default',
        customName = null,
        hideAvatar = false,
        hideLocation = true,
        hideEmail = true,
      } = options;

      const anonymousName =
        customName || AnonymousService.generateAnonymousName(nameStyle);
      const avatarColor = AnonymousService.generateAvatarColor(memberId);

      const { data, error } = await supabase
        .from('members')
        .update({
          is_anonymous: true,
          anonymous_display_name: anonymousName,
          anonymity_level: anonymityLevel,
          show_real_name: false,
          anonymous_avatar_color: avatarColor,
          hide_avatar: hideAvatar,
          hide_location: hideLocation,
          hide_email: hideEmail,
          anonymous_mode_enabled_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      // Log anonymous mode activation
      await AnonymousService.logAnonymousActivity(memberId, 'enabled', {
        level: anonymityLevel,
        timestamp: new Date().toISOString(),
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error enabling anonymous mode:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Disable anonymous mode
   */
  disableAnonymousMode: async (memberId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update({
          is_anonymous: false,
          anonymity_level: ANONYMITY_LEVELS.NONE,
          show_real_name: true,
          hide_avatar: false,
          hide_location: false,
          hide_email: false,
          anonymous_mode_disabled_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      // Log anonymous mode deactivation
      await AnonymousService.logAnonymousActivity(memberId, 'disabled', {
        timestamp: new Date().toISOString(),
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error disabling anonymous mode:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update anonymity settings
   */
  updateAnonymitySettings: async (memberId, settings) => {
    try {
      const allowedFields = [
        'anonymity_level',
        'anonymous_display_name',
        'hide_avatar',
        'hide_location',
        'hide_email',
      ];

      const updates = {};
      Object.keys(settings).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates[key] = settings[key];
        }
      });

      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating anonymity settings:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get member anonymity status
   */
  getAnonymityStatus: async (memberId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(
          'is_anonymous, anonymity_level, anonymous_display_name, anonymous_avatar_color, hide_avatar, hide_location, hide_email'
        )
        .eq('id', memberId)
        .single();

      if (error) throw error;

      return { success: true, status: data };
    } catch (error) {
      console.error('Error getting anonymity status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get display name (respects anonymity)
   */
  getDisplayName: (member) => {
    if (!member) return 'Unknown User';

    if (member.is_anonymous && member.anonymous_display_name) {
      return member.anonymous_display_name;
    }

    return member.full_name || member.email?.split('@')[0] || 'User';
  },

  /**
   * Get display avatar (respects anonymity)
   */
  getDisplayAvatar: (member) => {
    if (!member) return null;

    if (member.is_anonymous || member.hide_avatar) {
      if (member.anonymous_avatar_color && member.anonymous_display_name) {
        return AnonymousService.generateAvatarUrl(
          member.anonymous_display_name,
          member.id
        );
      }
      return null;
    }

    return member.avatar_url || null;
  },

  /**
   * Get display info (respects all privacy settings)
   */
  getDisplayInfo: (member) => {
    if (!member) {
      return {
        name: 'Unknown User',
        avatar: null,
        email: null,
        location: null,
        isAnonymous: true,
      };
    }

    return {
      name: AnonymousService.getDisplayName(member),
      avatar: AnonymousService.getDisplayAvatar(member),
      email: member.hide_email ? null : member.email,
      location: member.hide_location ? null : member.location,
      isAnonymous: member.is_anonymous,
      anonymityLevel: member.anonymity_level,
    };
  },

  /**
   * Check if member is in anonymous mode
   */
  isAnonymous: async (memberId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('is_anonymous, anonymity_level')
        .eq('id', memberId)
        .single();

      if (error) throw error;

      return {
        success: true,
        isAnonymous: data.is_anonymous,
        level: data.anonymity_level,
      };
    } catch (error) {
      console.error('Error checking anonymous status:', error);
      return { success: false, isAnonymous: false };
    }
  },

  /**
   * Enable whistleblower protection
   */
  enableWhistleblowerProtection: async (memberId) => {
    try {
      const anonymousName = AnonymousService.generateAnonymousName('descriptive');

      const { data, error } = await supabase
        .from('members')
        .update({
          is_anonymous: true,
          anonymity_level: ANONYMITY_LEVELS.WHISTLEBLOWER,
          anonymous_display_name: anonymousName,
          show_real_name: false,
          hide_avatar: true,
          hide_location: true,
          hide_email: true,
          whistleblower_protection_enabled: true,
          whistleblower_protection_enabled_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      // Log whistleblower protection activation
      await AnonymousService.logAnonymousActivity(memberId, 'whistleblower_enabled', {
        timestamp: new Date().toISOString(),
        level: ANONYMITY_LEVELS.WHISTLEBLOWER,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error enabling whistleblower protection:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get anonymous activity count
   */
  getAnonymousActivityCount: async (memberId) => {
    try {
      // Get counts of anonymous activities
      const [petitions, votes, comments] = await Promise.all([
        supabase
          .from('petitions')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('is_anonymous', true),
        supabase
          .from('petition_votes')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('is_anonymous', true),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('is_anonymous', true),
      ]);

      return {
        success: true,
        counts: {
          petitions: petitions.count || 0,
          votes: votes.count || 0,
          comments: comments.count || 0,
          total: (petitions.count || 0) + (votes.count || 0) + (comments.count || 0),
        },
      };
    } catch (error) {
      console.error('Error getting anonymous activity count:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Log anonymous activity
   */
  logAnonymousActivity: async (memberId, activityType, metadata = {}) => {
    try {
      const { error } = await supabase.from('anonymous_activity_log').insert([
        {
          member_id: memberId,
          activity_type: activityType,
          metadata,
        },
      ]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error logging anonymous activity:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get anonymous activity log
   */
  getActivityLog: async (memberId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('anonymous_activity_log')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, activities: data || [] };
    } catch (error) {
      console.error('Error getting activity log:', error);
      return { success: false, error: error.message, activities: [] };
    }
  },

  /**
   * Validate anonymous name (check if already taken)
   */
  validateAnonymousName: async (name) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .eq('anonymous_display_name', name)
        .maybeSingle();

      if (error) throw error;

      return { success: true, available: !data };
    } catch (error) {
      console.error('Error validating anonymous name:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Set custom anonymous name
   */
  setCustomAnonymousName: async (memberId, customName) => {
    try {
      // Validate name first
      const { available } = await AnonymousService.validateAnonymousName(customName);

      if (!available) {
        return { success: false, error: 'Name already taken' };
      }

      const { data, error } = await supabase
        .from('members')
        .update({ anonymous_display_name: customName })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error setting custom anonymous name:', error);
      return { success: false, error: error.message };
    }
  },
};

// Export as default for backwards compatibility
export default AnonymousService;
