import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/auth/AuthLayout";
import { toast } from "sonner";


const LoginPage = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const userNameError = submitted && !userName.trim();
  const passwordError = submitted && !password;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!userName.trim() || !password || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (await login(userName.trim(), password)) return;
    } catch (error) {
      toast.error("Sign in failed", {
        description: error instanceof Error ? error.message : "Check your credentials and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your CyberERP account to access your workspace."
      footer={
        // Enterprise access model — accounts are provisioned by an administrator, never
        // self-registered, which is why there is no "create account" link.
        <p className="text-center text-xs text-muted-foreground">
          Need access? Contact your system administrator.
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-username" className="text-sm font-medium text-foreground">
            User Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="login-username"
            name="username"
            autoComplete="username"
            autoFocus
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            aria-invalid={userNameError}
            className="h-11"
            placeholder="User Name"
          />
          {userNameError && <p className="text-xs text-destructive">Username is required.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground">
            Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
              onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
              aria-invalid={passwordError}
              className="h-11 pr-11"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError ? (
            <p className="text-xs text-destructive">Password is required.</p>
          ) : capsLock ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">Caps Lock is on.</p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full font-display font-semibold shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" /> Sign In
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
