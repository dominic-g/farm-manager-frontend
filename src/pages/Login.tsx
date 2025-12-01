import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Group, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // 1. Call WordPress JWT Endpoint
      const authUrl = import.meta.env.VITE_API_AUTH_URL || 'http://localhost/wordpress/wp-json/jwt-auth/v1';
      const response = await axios.post(`${authUrl}/token`, {
        username: values.username,
        password: values.password
      });

      // 2. If success, save token
      if (response.data.token) {
        login(response.data.token, {
            user_email: response.data.user_email,
            user_nicename: response.data.user_nicename,
            user_display_name: response.data.user_display_name
        });
        
        notifications.show({
            title: 'Welcome back!',
            message: 'Login successful',
            color: 'green'
        });

        // 3. Redirect to Dashboard
        navigate('/'); 
      }
    } catch (error) {
      notifications.show({
        title: 'Login Failed',
        message: 'Invalid username or password',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2}>
        Farm Management System
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" pos="relative">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput 
            label="Username" 
            placeholder="Farmer123" 
            required 
            {...form.getInputProps('username')} 
          />
          <PasswordInput 
            label="Password" 
            placeholder="Your password" 
            required 
            mt="md" 
            {...form.getInputProps('password')} 
          />
          
          <Button fullWidth mt="xl" type="submit">
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
}