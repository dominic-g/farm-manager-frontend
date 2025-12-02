import { useState } from 'react';
import { Paper, TextInput, PasswordInput, Button, Title, Text, Anchor, Container } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import classes from './Login.module.css'; // Reuse Login styles

export function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { username: '', email: '', password: '', confirmPassword: '' },
    validate: {
        password: (val) => (val.length < 6 ? 'Password too short' : null),
        confirmPassword: (val, values) => (val !== values.password ? 'Passwords do not match' : null),
    }
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '');
      await axios.post(`${apiUrl}/farm/v1/register`, {
        username: values.username,
        email: values.email,
        password: values.password
      });

      notifications.show({ 
          title: 'Registration Successful', 
          message: 'Please wait for admin approval before logging in.', 
          color: 'green',
          autoClose: 10000 
      });
      navigate('/login');
    } catch (error: any) {
      notifications.show({ 
          title: 'Registration Failed', 
          message: error.response?.data?.message || 'Error creating account', 
          color: 'red' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
          Create Farm Account
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput label="Username" placeholder="MyFarm" required {...form.getInputProps('username')} />
            <TextInput label="Email" placeholder="farm@email.com" mt="md" required {...form.getInputProps('email')} />
            <PasswordInput label="Password" mt="md" required {...form.getInputProps('password')} />
            <PasswordInput label="Confirm Password" mt="md" required {...form.getInputProps('confirmPassword')} />
            
            <Button fullWidth mt="xl" size="md" type="submit" loading={loading}>
                Register
            </Button>

            <Text ta="center" mt="md">
            Already have an account?{' '}
            <Anchor component="button" type="button" fw={700} onClick={() => navigate('/login')}>
                Login
            </Anchor>
            </Text>
        </form>
      </Paper>
    </div>
  );
}