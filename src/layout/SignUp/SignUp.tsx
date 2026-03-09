import { AuthForm } from '@components/AuthForm/AuthForm';
import { LoginRequest } from '@entities/authRequest';
import api from '@utils/api';
import { setToken } from '@utils/helpers';

export const SignUp = () => {
  async function handleRegister(data: LoginRequest): Promise<void> {
    const response = await api.post('/auth/register', data);

    if (response.status !== 200) {
      throw new Error('Login failed');
    }

    const result = await response.data;
    setToken(result.token);
    console.log('Registered', result);
  }

  return <AuthForm mode="register" onSubmit={handleRegister} />;
};
