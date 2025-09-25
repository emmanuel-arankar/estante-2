import { LoginForm } from '../components/auth/LoginForm';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 w-full overflow-x-hidden">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col items-center justify-center text-center space-y-6"
        >
          <div className="flex flex-column items-center space-x-3">
            <div className="bg-emerald-600 p-4 rounded-2xl">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            <div className="flex flex-col text-left justify-center">
              <span className="text-3xl font-bold text-emerald-700 font-sans">Estante de Bolso</span>
              <p className="text-xl text-gray-500 hidden sm:block font-sans">Toda literatura na palma da sua mão</p>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-md">
            Conecte-se com outros leitores e descubra seu próximo livro favorito
          </p>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
};