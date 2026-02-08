import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { FaSave, FaKey } from 'react-icons/fa';
import { authService } from '../services/authService';

const Profile = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    (async () => {
      try {
        const resp = await authService.getMe();
        const d = resp.data.driver;
        setForm({ name: d.fullName || d.name || '', email: d.email || '', phone: d.phone || '' });
      } catch (err) {
        setToast({ message: 'Erro ao carregar perfil', type: 'error' });
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      const resp = await authService.updateProfile({ name: form.name, email: form.email, phone: form.phone });
      setToast({ message: resp.data.message || 'Perfil atualizado', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Erro ao atualizar perfil', type: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (pwd.newPassword !== pwd.confirm) return setToast({ message: 'As senhas não conferem', type: 'error' });
    try {
      const resp = await authService.changePassword({ oldPassword: pwd.oldPassword, newPassword: pwd.newPassword });
      setToast({ message: resp.data.message || 'Senha alterada', type: 'success' });
      setPwd({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Erro ao alterar senha', type: 'error' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Ajustes do Perfil</h1>
        </div>

        <div className="bg-white shadow rounded p-6 mb-6">
          <h2 className="font-semibold mb-4">Dados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="px-3 py-2 border rounded" placeholder="Nome" />
            <input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="px-3 py-2 border rounded" placeholder="Email" />
            <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="px-3 py-2 border rounded" placeholder="Telefone" />
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"><FaSave /> Salvar</button>
            <button onClick={() => navigate('/home')} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
          </div>
        </div>

        <div className="bg-white shadow rounded p-6">
          <h2 className="font-semibold mb-4">Alterar Senha</h2>
          <div className="grid grid-cols-1 gap-3">
            <input type="password" value={pwd.oldPassword} onChange={(e) => setPwd({...pwd, oldPassword: e.target.value})} className="px-3 py-2 border rounded" placeholder="Senha atual" />
            <input type="password" value={pwd.newPassword} onChange={(e) => setPwd({...pwd, newPassword: e.target.value})} className="px-3 py-2 border rounded" placeholder="Nova senha" />
            <input type="password" value={pwd.confirm} onChange={(e) => setPwd({...pwd, confirm: e.target.value})} className="px-3 py-2 border rounded" placeholder="Confirme nova senha" />
          </div>
          <div className="mt-4">
            <button onClick={handleChangePassword} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"><FaKey /> Alterar senha</button>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default Profile;
