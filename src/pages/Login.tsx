import { useState } from 'react';
import { Paper, TextInput, PasswordInput, Button, Title, Text, Anchor, LoadingOverlay, Container } from '@mantine/core';
import classes from './Login.module.css';
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
    initialValues: { username: '', password: '' },
    validate: {
        username: (val) => (val.length < 2 ? 'Username is too short' : null),
        password: (val) => (val.length < 2 ? 'Password is required' : null),
    }
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const authUrl = import.meta.env.VITE_API_AUTH_URL;
      const response = await axios.post(`${authUrl}/token`, {
        username: values.username,
        password: values.password
      });

      if (response.data.token) {
        login(response.data.token, {
            user_email: response.data.user_email,
            user_nicename: response.data.user_nicename,
            user_display_name: response.data.user_display_name
        });
        notifications.show({ title: 'Welcome back!', message: 'Login successful', color: 'green' });
        navigate('/'); 
      }
    } catch (error) {
      notifications.show({ title: 'Login Failed', message: 'Invalid credentials', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
        
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
          Farm Manager
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput 
                label="Username" 
                placeholder="Farmer123" 
                size="md" 
                mt="md"
                {...form.getInputProps('username')} 
            />
            <PasswordInput 
                label="Password" 
                placeholder="Your password" 
                mt="md" 
                size="md" 
                {...form.getInputProps('password')} 
            />
            
            <Button fullWidth mt="xl" size="md" type="submit">
                Login
            </Button>

            <Text ta="center" mt="md">
            Don&apos;t have an account?{' '}
            <Anchor href="#" fw={700} onClick={(event) => event.preventDefault()}>
                Register
            </Anchor>
            </Text>
        </form>
      </Paper>
    </div>
  );
}