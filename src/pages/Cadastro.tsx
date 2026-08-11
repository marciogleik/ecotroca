import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  UserPlus, 
  School, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Building,
  Coins,
  Loader2
} from 'lucide-react';
import { Card, CardBody, Button, Input } from '../components/ui';

const Cadastro: React.FC = () => {
  const [searchParams] = useSearchParams();
  const keyParam = searchParams.get('key') || '';
  
  const [invite, setInvite] = useState<any | null>(null);
  const [isValidKey, setIsValidKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate the invite code against the database
  useEffect(() => {
    if (!keyParam) {
      setIsValidKey(false);
      setCheckingKey(false);
      return;
    }

    const validateKey = async () => {
      setCheckingKey(true);
      try {
        const { data, error } = await supabase
          .from('invites')
          .select('*, schools(name)')
          .eq('code', keyParam)
          .single();

        if (error || !data) {
          setIsValidKey(false);
          setInvite(null);
          return;
        }

        // Check if already used
        if (data.used_at) {
          setIsValidKey(false);
          setInvite({ ...data, reason: 'used' });
          return;
        }

        // Check expiry
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setIsValidKey(false);
          setInvite({ ...data, reason: 'expired' });
          return;
        }

        setInvite(data);
        setIsValidKey(true);
      } catch (err) {
        setIsValidKey(false);
      } finally {
        setCheckingKey(false);
      }
    };

    validateKey();
  }, [keyParam]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidKey || !invite) return;

    if (password.length < 6) {
      toast.error('A senha deve conter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Sign up in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role: invite.role }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. If school role, link the school_id to the profile
        if (invite.role === 'escola' && invite.school_id) {
          await supabase
            .from('profiles')
            .update({ school_id: invite.school_id })
            .eq('id', data.user.id);
        }

        // 3. Mark invite as used
        await supabase
          .from('invites')
          .update({
            used_at: new Date().toISOString(),
            used_by_email: email.trim()
          })
          .eq('id', invite.id);

        toast.success('Cadastro realizado com sucesso!');
        setSuccess(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = () => {
    if (!invite) return UserPlus;
    switch (invite.role) {
      case 'escola': return School;
      case 'prefeitura': return Building;
      case 'sicredi': return Coins;
      default: return UserPlus;
    }
  };

  const getRoleLabel = () => {
    switch (invite?.role) {
      case 'escola': return 'Administrador de Escola';
      case 'prefeitura': return 'Gestão da Prefeitura';
      case 'sicredi': return 'Representante Sicredi';
      default: return '';
    }
  };

  const RoleIcon = getRoleIcon();

  // Loading
  if (checkingKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-prefeitura animate-spin" />
      </div>
    );
  }

  // Access denied
  if (!isValidKey) {
    const reason = invite?.reason;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="border-red-100 bg-white">
            <CardBody className="text-center p-8 space-y-6">
              <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-full border border-red-100">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {reason === 'used' ? 'Convite já utilizado' : reason === 'expired' ? 'Convite expirado' : 'Acesso Negado'}
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {reason === 'used'
                  ? 'Este link de convite já foi utilizado para criar uma conta. Solicite um novo convite à Prefeitura.'
                  : reason === 'expired'
                  ? 'Este link de convite expirou. Solicite um novo convite à Prefeitura.'
                  : 'Este link de cadastro é inválido ou privado. Verifique se você recebeu o link correto da Prefeitura.'
                }
              </p>
              <div className="border-t border-slate-100 pt-6">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ir para Tela de Login
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="border-green-100 bg-white shadow-xl">
            <CardBody className="text-center p-8 space-y-6">
              <div className="inline-flex p-4 bg-green-50 text-green-700 rounded-full border border-green-100">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cadastro Concluído!</h2>
              <div className="text-sm text-slate-600 font-medium space-y-2">
                <p>O perfil de <strong>{email}</strong> foi registrado.</p>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-500 text-xs leading-relaxed">
                  {invite.role === 'escola'
                    ? `Sua conta foi vinculada à escola ${invite.schools?.name || ''}. Agora você já pode acessar o sistema.`
                    : `Sua conta de nível ${getRoleLabel()} está ativa para uso imediato.`}
                </p>
              </div>
              <div className="border-t border-slate-100 pt-6">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center px-5 py-3 bg-prefeitura text-white font-bold rounded-xl hover:bg-prefeitura-dark transition-colors shadow-md"
                >
                  Entrar no Sistema
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="/logo-prefeitura.png"
            alt="Logo Prefeitura"
            className="w-[220px] object-contain rounded-lg"
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Criar Conta de Acesso
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-semibold">
          EcoTroca Água Boa — {getRoleLabel()}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white shadow-xl border border-slate-100">
          <CardBody className="py-8 px-6 sm:px-10">

            {/* Invite info banner */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-sm">
                <RoleIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Perfil Autorizado</span>
                <span className="text-sm font-extrabold text-slate-800 block">{getRoleLabel()}</span>
                {invite.role === 'escola' && invite.schools?.name && (
                  <span className="text-xs text-escola font-bold block mt-0.5">📍 {invite.schools.name}</span>
                )}
                {invite.label && (
                  <span className="text-xs text-slate-400 block mt-0.5">{invite.label}</span>
                )}
              </div>
            </div>

            {invite.role === 'escola' && invite.schools?.name && (
              <div className="mb-5 p-3 bg-escola-light rounded-lg border border-escola/20 text-xs text-escola font-semibold">
                Este convite já está vinculado à <strong>{invite.schools.name}</strong>. Sua conta será associada automaticamente.
              </div>
            )}

            <form className="space-y-5" onSubmit={handleRegister}>
              <Input
                label="E-mail"
                type="email"
                placeholder="exemplo@escola.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                roleColor="prefeitura"
              />
              <Input
                label="Senha (mínimo 6 dígitos)"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                roleColor="prefeitura"
              />
              <Input
                label="Confirmar Senha"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                roleColor="prefeitura"
              />
              <div className="pt-2">
                <Button type="submit" disabled={submitting} className="w-full py-3" roleColor="prefeitura">
                  {submitting ? 'Cadastrando...' : 'Criar minha Conta'}
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-prefeitura transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Voltar para Tela de Login
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Cadastro;
