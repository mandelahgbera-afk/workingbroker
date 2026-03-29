import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Save, Eye, EyeOff, AlertTriangle, Wallet, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/api/supabaseClient";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "sonner";

const DEPOSIT_METHODS = [
  { key: "deposit_address_btc", label: "Bitcoin (BTC) Deposit Address", placeholder: "bc1q..." },
  { key: "deposit_address_eth", label: "Ethereum (ETH) Deposit Address", placeholder: "0x..." },
  { key: "deposit_address_usdt_trc20", label: "USDT (TRC20) Deposit Address", placeholder: "T..." },
  { key: "deposit_address_usdt_erc20", label: "USDT (ERC20) Deposit Address", placeholder: "0x..." },
  { key: "deposit_address_bnb", label: "BNB Deposit Address", placeholder: "bnb1..." },
  { key: "deposit_image_url", label: "Deposit QR Code / Banner Image URL", placeholder: "https://..." },
];

export default function PlatformSettingsPage() {
  const { user } = useOutletContext();
  const [settings, setSettings] = useState({});
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [showAddress, setShowAddress] = useState({});
  const [loading, setLoading] = useState(true);

  // Only super admins (role === "admin") can access
  const isSuperAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('platform_settings').select('*');
        if (error) throw error;
        const map = {};
        (data || []).forEach(r => { map[r.key] = r; });
        setSettings(map);
        setLoading(false);
      } catch (error) {
        console.error('Load error:', error);
        setLoading(false);
      }
    })();
  }, [isSuperAdmin]);

  const handleSave = async (key, label) => {
    if (!isSuperAdmin) { toast.error("Unauthorized"); return; }
    const value = editing[key];
    if (!value?.trim()) { toast.error("Value cannot be empty"); return; }
    setSaving(p => ({ ...p, [key]: true }));

    try {
      const existing = settings[key];
      if (existing?.id) {
        await supabase.from('platform_settings').update({ value: value.trim(), updated_by: user.email }).eq('id', existing.id);
      } else {
        await supabase.from('platform_settings').insert([{ key, value: value.trim(), label, updated_by: user.email }]);
      }

      // Refresh
      const { data: rows, error } = await supabase.from('platform_settings').select('*');
      if (error) throw error;
      const map = {};
      (rows || []).forEach(r => { map[r.key] = r; });
      setSettings(map);
      setEditing(p => { const n = { ...p }; delete n[key]; return n; });
      setSaving(p => ({ ...p, [key]: false }));
      toast.success(`${label} updated securely`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Error updating setting");
      setSaving(p => ({ ...p, [key]: false }));
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-3xl bg-destructive/15 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">Only super administrators can manage platform settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader user={user} title="Platform Settings" subtitle="Super admin controls — handle with care" />

      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        <p className="text-sm text-yellow-300">These settings control critical platform functions. Changes take effect immediately.</p>
      </div>

      {/* Settings grid */}
      <div className="grid gap-4">
        {DEPOSIT_METHODS.map((method, i) => {
          const current = settings[method.key];
          const isEditing = editing[method.key] !== undefined;
          const isSaving = saving[method.key];

          return (
            <motion.div key={method.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold">{method.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{method.key}</p>
                </div>
                {!isEditing && (
                  <button onClick={() => { setEditing(p => ({ ...p, [method.key]: current?.value || "" })); }}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="flex items-center gap-2">
                  {method.key.includes("address") && (
                    <button onClick={() => setShowAddress(p => ({ ...p, [method.key]: !p[method.key] }))}
                      className="text-muted-foreground hover:text-foreground">
                      {showAddress[method.key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  )}
                  <p className={`font-mono text-sm break-all ${current?.value ? "text-foreground" : "text-muted-foreground"}`}>
                    {current?.value ? (showAddress[method.key] ? current.value : "••••••••••••••••") : "Not set"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input value={editing[method.key]} onChange={(e) => setEditing(p => ({ ...p, [method.key]: e.target.value }))}
                    placeholder={method.placeholder} className="font-mono text-sm" />
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(method.key, method.label)} disabled={isSaving}
                      className="gradient-green text-white text-xs font-semibold flex-1">
                      <Save className="w-3.5 h-3.5 mr-1" /> {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={() => setEditing(p => { const n = { ...p }; delete n[method.key]; return n; })} variant="outline" className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
