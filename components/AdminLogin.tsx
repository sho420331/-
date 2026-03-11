import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0214') {
      onLoginSuccess();
    } else {
      setError('パスワードが間違っています');
      setPassword('');
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 relative">
       <button onClick={onBack} className="absolute top-4 left-4 md:top-8 md:left-8 text-gray-500 hover:text-orange-600 flex items-center gap-2 p-2">
        <ArrowLeft size={20} /> <span className="hidden md:inline">戻る</span>
      </button>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-md border-4 border-orange-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">管理者ログイン</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="パスワードを入力 (0214)"
              inputMode="numeric"
              className="w-full text-center text-xl md:text-2xl tracking-widest p-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 outline-none transition-colors"
              autoFocus
            />
            {error && <p className="text-red-500 text-center mt-2 text-sm">{error}</p>}
          </div>
          
          <button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg transition-transform transform active:scale-95"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;