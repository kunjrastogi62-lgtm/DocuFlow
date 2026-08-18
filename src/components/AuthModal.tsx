import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  ArrowRight, 
  X, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Check
} from 'lucide-react';
import { supabase, resendConfirmationEmail } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  canClose = true 
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  
  // Verification / Confirmation Screen State
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isCheckingConfirmation, setIsCheckingConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [checkStatusMsg, setCheckStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignUp && !identifier.trim()) {
      setErrorMsg('Please enter your username or Gmail.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    setResendStatus(null);
    setCheckStatusMsg(null);

    const userEmail = email.trim();
    const userUsername = username.trim() || userEmail.split('@')[0];
    const userFullName = fullName.trim() || userUsername;

    try {
      if (isSignUp) {
        // Sign up with Supabase with email confirmation for first-time users
        const { data, error } = await supabase.auth.signUp({
          email: userEmail,
          password: password,
          options: {
            data: {
              full_name: userFullName,
              username: userUsername,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          setErrorMsg(error.message || 'Failed to sign up. Please try again.');
          setLoading(false);
          return;
        }

        // If user is already confirmed and session returned immediately
        if (data.session && data.user?.email_confirmed_at) {
          onSuccess();
          if (canClose && onClose) onClose();
          return;
        }

        // Transition to mandatory Email Verification screen ONLY for first-time sign-up
        setConfirmedEmail(userEmail);
        setIsAwaitingConfirmation(true);
      } else {
        // Sign in for existing users - logs in directly without confirm email screen
        const identifierStr = identifier.trim();
        let loginEmail = identifierStr;

        if (!identifierStr.includes('@')) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', identifierStr)
            .maybeSingle();

          if (profile && profile.email) {
            loginEmail = profile.email;
          } else {
            setErrorMsg('Username or Gmail not found. Please check your details and try again.');
            setLoading(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });

        if (error) {
          setErrorMsg(error.message || 'Invalid email or password. Please try again.');
          setLoading(false);
          return;
        }

        if (data.user) {
          onSuccess();
          if (canClose && onClose) onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!confirmedEmail) return;
    setIsResending(true);
    setResendStatus(null);
    setCheckStatusMsg(null);
    try {
      const result = await resendConfirmationEmail(confirmedEmail);
      if (result.success) {
        setResendStatus('A fresh confirmation link has been sent to your Gmail inbox!');
      } else {
        setResendStatus(result.message || 'Confirmation email sent. Please check your inbox.');
      }
    } catch (err: any) {
      setResendStatus('Confirmation email resent. Please check your inbox.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckConfirmationStatus = async () => {
    setIsCheckingConfirmation(true);
    setCheckStatusMsg(null);
    try {
      // 1. Try getSession
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && (session.user.email_confirmed_at || session.user.confirmed_at)) {
        setCheckStatusMsg({ text: 'Email confirmed! Logging you in...', isError: false });
        setTimeout(() => {
          onSuccess();
          if (canClose && onClose) onClose();
        }, 600);
        return;
      }

      // 2. Try signing in if password is saved in state
      if (password && confirmedEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: confirmedEmail,
          password: password,
        });

        if (!error && data.user) {
          setCheckStatusMsg({ text: 'Email verified successfully! Entering DocuFlow...', isError: false });
          setTimeout(() => {
            onSuccess();
            if (canClose && onClose) onClose();
          }, 600);
          return;
        }

        if (error) {
          const lower = error.message.toLowerCase();
          if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
            setCheckStatusMsg({ 
              text: 'Email not confirmed yet. Please open Gmail, click the link in the email from DocuFlow, and try again.', 
              isError: true 
            });
            return;
          }
        }
      }

      setCheckStatusMsg({ 
        text: 'Confirmation link not clicked yet. Please click the confirmation link in your Gmail, then return here.', 
        isError: true 
      });
    } catch (err: any) {
      setCheckStatusMsg({ text: 'Unable to verify status. Please check your Gmail or try signing in.', isError: true });
    } finally {
      setIsCheckingConfirmation(false);
    }
  };

  const handleOpenGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  const handleBackdropClick = () => {
    // Only close if allowed and user is already authenticated
    if (canClose && !isAwaitingConfirmation && onClose) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BANNER: Shown on Sign Up (first-time registration) & Confirmation Screen. NOT shown on Sign In (existing account). */}
        {(isSignUp || isAwaitingConfirmation) && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 text-center shadow-md tracking-wide animate-in fade-in slide-in-from-top-2 duration-200">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
            <span className="uppercase">Not Enter DocuFlow without email confirm</span>
          </div>
        )}

        {/* Close Button - Only visible if canClose is true AND not awaiting email verification */}
        {canClose && !isAwaitingConfirmation && onClose && (
          <button
            onClick={onClose}
            className={`absolute right-4 ${ (isSignUp || isAwaitingConfirmation) ? 'top-12' : 'top-4' } text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors z-10`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isAwaitingConfirmation ? (
          /* Check Gmail Confirmation Screen */
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              {/* Animated Mail Icon with Shield Badge */}
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                  <Mail className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900">Email Confirmation Required</h2>
              <p className="text-xs text-slate-600 mt-1.5 max-w-xs leading-relaxed">
                To protect your documents, you <strong>must verify your email</strong> before entering DocuFlow.
              </p>

              {/* Highlighted Email Box */}
              <div className="mt-3.5 mb-4 px-4 py-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-950 font-semibold text-sm flex items-center gap-2 max-w-full truncate shadow-xs">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{confirmedEmail}</span>
              </div>

              {/* Check Status Message */}
              {checkStatusMsg && (
                <div className={`w-full mb-3.5 p-3 rounded-xl text-xs flex items-start gap-2 text-left ${
                  checkStatusMsg.isError 
                    ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                }`}>
                  {checkStatusMsg.isError ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <span>{checkStatusMsg.text}</span>
                </div>
              )}

              {/* Resend Status Message */}
              {resendStatus && (
                <div className="w-full mb-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 text-left">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-left text-xs text-slate-600 w-full mb-5 space-y-1.5">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span>How to confirm:</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Open your <strong>Gmail inbox</strong> (or Spam folder).</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Click the confirmation link sent to <strong>{confirmedEmail}</strong>.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>Click the link in the email to activate your account and enter.</span>
                </p>
              </div>

              {/* Action: Open Gmail Button */}
              <button
                type="button"
                onClick={handleOpenGmail}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open Gmail Inbox</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
              </button>

              {/* Resend control */}
              <div className="flex items-center justify-center w-full text-xs text-slate-500 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Resending confirmation email...' : 'Resend Confirmation Email'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Sign In / Sign Up Screen */
          <div className="p-6 sm:p-8">
            {/* Top Switcher Tabs (Sign In / Sign Up) */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                  !isSignUp 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In (Existing Account)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                  isSignUp 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Sign Up</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">Email Verify</span>
              </button>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/25 mb-2.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {isSignUp ? 'Create Your Account' : 'Sign In to DocuFlow'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {isSignUp 
                  ? 'Sign up with your Gmail. A confirmation link will be sent.' 
                  : 'Enter your credentials to access your verified account.'}
              </p>
            </div>

            {/* Error / Info Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                {infoMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isSignUp ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username or Gmail</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your username or Gmail"
                      className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enter your username</label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enter Your Gmail</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Processing...' : (isSignUp ? 'Sign Up & Send Confirmation' : 'Sign In & Enter')}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="mt-5 text-center text-xs text-slate-500">
              {isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMsg(null);
                    }}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg(null);
                    }}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
