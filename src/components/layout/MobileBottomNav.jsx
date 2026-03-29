import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BarChart3, ArrowLeftRight,
  Users, Settings
} from "lucide-react";

const userNavItems = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/portfolio", label: "Portfolio", icon: BarChart3 },
  { path: "/trade", label: "Trade", icon: ArrowLeftRight },
  { path: "/copy-trading", label: "Copy", icon: Users },
  { path: "/settings", label: "More", icon: Settings },
];

const adminNavItems = [
  { path: "/admin", label: "Admin", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/cryptos", label: "Cryptos", icon: BarChart3 },
  { path: "/admin/traders", label: "Traders", icon: ArrowLeftRight },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function MobileBottomNav({ isAdmin }) {
  const location = useLocation();
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-gradient-to-t from-background via-background/95 to-background/80 border-t border-primary/10 backdrop-blur-2xl">
      {/* Top gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Navigation */}
      <nav className="flex items-center justify-between h-20 px-1 safe-area-inset-bottom">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex-1 h-full"
            >
              <Link
                to={item.path}
                className="relative flex flex-col items-center justify-center w-full h-full group"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNav"
                    className="absolute inset-0 bg-primary/8 rounded-2xl border border-primary/20 m-2"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Content wrapper */}
                <div className="relative flex flex-col items-center justify-center gap-1 z-10">
                  {/* Icon container */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      y: isActive ? -2 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-primary/20 text-primary shadow-lg shadow-primary/20"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    animate={{
                      opacity: isActive ? 1 : 0.6,
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className={`text-[11px] font-bold whitespace-nowrap transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                </div>

                {/* Ripple effect on press */}
                <motion.div
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  whileTap={{ scale: 0.95 }}
                  initial={false}
                />
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}
