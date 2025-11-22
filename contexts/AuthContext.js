import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';


const AuthContext = createContext({});


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 EMERGENCY: Forcing loading to FALSE after 5s');
      setLoading(false);
    }, 5000);


    checkUser();


    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(emergencyTimeout);
        console.log('Auth state changed:', event);
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );


    return () => {
      clearTimeout(emergencyTimeout);
      authListener?.subscription?.unsubscribe();
    };
  }, []);


  const checkUser = async () => {
    try {
      console.log('Checking for existing user...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 4000)
      );
      
      const userPromise = supabase.auth.getUser();
      
      const { data: { user }, error } = await Promise.race([
        userPromise,
        timeoutPromise
      ]).catch(err => {
        console.log('⚠️ Supabase call timed out:', err.message);
        return { data: { user: null }, error: null };
      });
      
      if (error) {
        console.log('No user session');
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }


      if (user) {
        console.log('User found:', user.id);
        setUser(user);
        await loadUserProfile(user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error in checkUser:', error);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };


  const loadUserProfile = async (userId) => {
    try {
      console.log('🔍 Loading profile for user:', userId);
      
      // ✅ PRIORITY 1: Check LAWYER table FIRST
      const { data: lawyerData, error: lawyerError } = await supabase
        .from('lawyers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();


      console.log('📊 Lawyer check:', { lawyerData, lawyerError });


      if (lawyerData && !lawyerError) {
        console.log('✅ User is a LAWYER');
        setUserProfile({ 
          ...lawyerData, 
          userType: 'lawyer', 
          role: 'lawyer' 
        });
        setLoading(false);
        return;
      }


      // ✅ PRIORITY 2: Check BODY table SECOND
      const { data: bodyData, error: bodyError } = await supabase
        .from('bodies')
        .select('*')
        .eq('id', userId)
        .maybeSingle();


      console.log('📊 Body check:', { bodyData, bodyError });


      if (bodyData && !bodyError) {
        console.log('✅ User is a BODY:', bodyData.name);
        setUserProfile({ 
          ...bodyData, 
          userType: 'body', 
          role: 'body_admin' 
        });
        setLoading(false);
        return;
      }


      // ✅ PRIORITY 3: Check MEMBER table THIRD (FALLBACK)
      console.log('📊 Checking members table for:', userId);
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .maybeSingle();


      console.log('📊 Member check:', { memberData, memberError });


      if (memberData && !memberError) {
        console.log('✅ User is a MEMBER:', memberData);
        setUserProfile({ 
          ...memberData, 
          userType: memberData.user_type || 'member',
          role: memberData.role || 'member'
        });
        setLoading(false);
        return;
      }


      // ✅ STEP 4: No profile found - set fallback to MEMBER
      console.log('⚠️ No profile found - using member fallback');
      setUserProfile({
        id: userId,
        userType: 'member',
        role: 'member'
      });
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setUserProfile({
        id: userId,
        userType: 'member',
        role: 'member'
      });
      setLoading(false);
    }
  };


  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };


  const value = {
    user,
    userProfile,
    userType: userProfile?.userType || null,
    userRole: userProfile?.role || null,
    loading,
    signOut,
    refreshProfile: () => user?.id && loadUserProfile(user.id),
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
