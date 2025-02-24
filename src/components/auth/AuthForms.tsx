import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { translations } from '../../utils/translations';

interface AuthFormProps {
  language: 'en' | 'he';
}

export function LoginForm({ language }: AuthFormProps) {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {language === 'en' ? 'Email' : 'דוא"ל'}
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          {language === 'en' ? 'Password' : 'סיסמה'}
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
      >
        {language === 'en' ? 'Login' : 'התחברות'}
      </button>
    </form>
  );
}

export function RegisterForm({ language }: AuthFormProps) {
  const { register } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ email, password, name });
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          {language === 'en' ? 'Name' : 'שם'}
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {language === 'en' ? 'Email' : 'דוא"ל'}
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          {language === 'en' ? 'Password' : 'סיסמה'}
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
      >
        {language === 'en' ? 'Register' : 'הרשמה'}
      </button>
    </form>
  );
} 