import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../supabase';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const detectProfileType = async (userId) => {
    // Check members table
    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('id', userId)
      .single();

    if (memberData) {
      return { type: 'member', profile: memberData };
    }

    // Check bodies table
    const { data: bodyData } = await supabase
      .from('bodies')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (bodyData) {
      return { type: 'body', profile: bodyData };
    }

    // Check lawyers table
    const { data: lawyerData } = await supabase
      .from('lawyers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (lawyerData) {
      return { type: 'lawyer', profile: lawyerData };
    }

    return null;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in both email and password');
      return;
    }

    setLoading(true);

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
      setLoading(false);
      return;
    }

    // Detect profile type
    const profileInfo = await detectProfileType(data.user.id);

    setLoading(false);

    if (!profileInfo) {
      alert('Profile not found. Please contact support.');
      await supabase.auth.signOut();
      return;
    }

    alert(`Login successful! Welcome ${profileInfo.type}!`);
    
    // Pass both user and profile info
    if (onLoginSuccess) {
      onLoginSuccess({
        user: data.user,
        profileType: profileInfo.type,
        profile: profileInfo.profile,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button 
          title="Login" 
          onPress={handleLogin}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
  },
});
