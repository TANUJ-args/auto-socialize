import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, UserPlus, Sparkles, Lock } from "lucide-react";
import { mapAuthError } from "@/lib/auth-errors";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@/contexts/AuthContext";

export default function Auth() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'otp' | 'login' | 'signup'>('otp');
  const [password, setPassword] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn("email-otp", { email });
      setStep("code");
      toast.success("Check your email for the verification code!");
    } catch (error) {
      toast.error(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn("email-otp", { email, code });
      toast.success("Welcome to Auto-Socialize!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    try {
      await signIn("anonymous");
      toast.success("Welcome! You're in guest mode.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="glass p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome to Auto-Socialize</h1>
            <p className="mt-2 text-muted-foreground">
              {step === "email" ? "Sign in or create an account" : "Enter verification code"}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button variant={authMode === 'otp' ? 'gradient' : 'ghost'} onClick={() => setAuthMode('otp')} disabled={loading}>OTP</Button>
            <Button variant={authMode === 'login' ? 'gradient' : 'ghost'} onClick={() => setAuthMode('login')} disabled={loading}>Login</Button>
            <Button variant={authMode === 'signup' ? 'gradient' : 'ghost'} onClick={() => setAuthMode('signup')} disabled={loading}>Sign up</Button>
          </div>

          {authMode === 'otp' && step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                <Mail className="mr-2 h-4 w-4" />
                Send Code
              </Button>
            </form>
          ) : authMode === 'otp' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
                disabled={loading}
              />
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                Verify Code
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("email")}
                disabled={loading}
              >
                Use Different Email
              </Button>
            </form>
          ) : authMode === 'login' ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                await signIn('password-login', { email, password });
                toast.success('Welcome back!');
                navigate('/dashboard');
              } catch (error) {
                toast.error(mapAuthError(error));
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                <Lock className="mr-2 h-4 w-4" />
                Log In
              </Button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                await signIn('password-signup', { email, password });
                toast.success('Account created!');
                navigate('/dashboard');
              } catch (error) {
                toast.error(mapAuthError(error));
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create account
              </Button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button
              variant="glass"
              className="mt-4 w-full"
              onClick={handleGuestMode}
              disabled={loading}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Continue as Guest
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}