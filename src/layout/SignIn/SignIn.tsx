import { AuthForm } from '@components/AuthForm/AuthForm';
import { LoginRequest } from '@entities/authRequest';
import api from '@utils/api';
import { setToken } from '@utils/helpers';

export const SignIn = () => {
  async function handleLogin(data: LoginRequest): Promise<void> {
    const response = await api.post('/auth/login', data);

    if (response.status !== 200) {
      throw new Error('Login failed');
    }

    const result = await response.data;
    setToken(result.token);
    console.log('Logged in', result);
  }

  return <AuthForm mode="login" onSubmit={handleLogin} />;
};
