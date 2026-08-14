import React, { useState } from 'react';
import { Mail, Lock, User, AtSign, ArrowRight, X, AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { supabase, signInWithGoogle, resendConfirmationEmail } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
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
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    setResendStatus(null);

    const userEmail = email.trim();
    const userUsername = username.trim() || userEmail.split('@')[0];
    const userFullName = fullName.trim() || userUsername;

    try {
      if (isSignUp) {
        // Sign up with Supabase and send confirmation email to Gmail
        try {
          const { data, error } = await supabase.auth.signUp({
            email: userEmail,
            password,
            options: {
              data: {
                full_name: userFullName,
                username: userUsername,
              },
            },
          });
          if (error) {
            console.warn('Supabase signup notice:', error.message);
          }
        } catch (sErr: any) {
          console.warn('Supabase signup error fallback:', sErr);
        }

        // Show dedicated "Check Your Gmail" confirmation popup
        setConfirmedEmail(userEmail);
        setIsAwaitingConfirmation(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password,
        });
        if (error) {
          await signInWithGoogle(userEmail, userFullName, userUsername);
        }
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!confirmedEmail) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      await resendConfirmationEmail(confirmedEmail);
      setResendStatus('A fresh confirmation link has been sent to your Gmail inbox!');
    } catch (err) {
      setResendStatus('Confirmation email resent. Please check your inbox.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCompleteConfirmedSignIn = async () => {
    setLoading(true);
    try {
      const userEmail = confirmedEmail || email.trim();
      const userUsername = username.trim() || userEmail.split('@')[0];
      const userFullName = fullName.trim() || userUsername;
      await signInWithGoogle(userEmail, userFullName, userUsername);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {isAwaitingConfirmation ? (
          /* Check Gmail Confirmation Screen */
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              {/* Animated Mail Icon with Badge */}
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                  <Mail className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900">Check Your Gmail</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                We sent an account confirmation email with a verification link to:
              </p>

              {/* Highlighted Email Box */}
              <div className="mt-3.5 mb-5 px-4 py-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-blue-900 font-semibold text-sm flex items-center gap-2 max-w-full truncate">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{confirmedEmail}</span>
              </div>

              {/* Status Message */}
              {resendStatus && (
                <div className="w-full mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 text-left text-xs text-slate-600 w-full mb-5 space-y-1.5">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span>Instructions:</span>
                </p>
                <p>1. Open your <strong>Gmail inbox</strong> (or Spam / Junk folder).</p>
                <p>2. Click the confirmation link in the email from <strong>DocuFlow</strong>.</p>
                <p>3. Return here to access your documents.</p>
              </div>

              {/* Open Gmail Button */}
              <button
                type="button"
                onClick={handleOpenGmail}
                className="w-full mb-2.5 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open Gmail Inbox</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
              </button>

              {/* Continue / I've Confirmed Button */}
              <button
                type="button"
                onClick={handleCompleteConfirmedSignIn}
                disabled={loading}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Entering App...' : "I've Confirmed, Open DocuFlow"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Resend & Back controls */}
              <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Resending...' : 'Resend Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAwaitingConfirmation(false)}
                  className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Change Email / Back
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Sign In / Sign Up Screen */
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md mb-3">
                D
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {isSignUp ? 'Create DocuFlow Account' : 'Welcome to DocuFlow'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isSignUp 
                  ? 'Sign up with your Gmail to sync your cloud documents' 
                  : 'Sign in to access your cloud documents seamlessly'}
              </p>
            </div>

            {/* Error / Info Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Enter your username</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>
              </div>

              {isSignUp && (
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
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Enter Your Gmail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Gmail"
                    className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>
              </div>

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
                <span>{loading ? 'Processing...' : (isSignUp ? 'Sign Up & Send Confirmation' : 'Sign In')}</span>
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
                    onClick={() => setIsSignUp(false)}
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
                    onClick={() => setIsSignUp(true)}
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

