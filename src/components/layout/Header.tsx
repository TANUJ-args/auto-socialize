import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  const isAuthPage = location.pathname === "/auth";
  const isLandingPage = location.pathname === "/";

  if (isAuthPage) return null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg select-none">A</span>
          </div>
          <span className="text-xl font-bold gradient-text">Auto-Socialize</span>
        </Link>

        <nav className="flex items-center gap-4">
          {!isLandingPage && user && (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost">Settings</Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
          {isLandingPage && !user && (
            <Link to="/auth">
              <Button variant="gradient">Get Started</Button>
            </Link>
          )}
        </nav>
      </div>
    </motion.header>
  );
}