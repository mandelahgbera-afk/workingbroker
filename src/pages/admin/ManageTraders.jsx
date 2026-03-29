import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, X, Shield, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/api/supabaseClient";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "sonner";

const RISK_LEVELS = ["low", "medium", "high"];
const EMPTY = {
  trader_name: "",
  specialty: "Multi-Strategy",
  risk_level: "medium",
  total_profit_pct: 0,
  win_rate: 0,
  total_trades: 0,
  followers: 0,
  profit_split_pct: 20,
  min_allocation: 100,
  avatar_color: "#6366f1"
};

export default function ManageTraders() {
  const { user } = useOutletContext();
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | trader object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data, error } = await supabase.from('traders').select('*');
      if (error) throw error;
      setTraders(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = (t) => { setForm({ ...t }); setModal(t); };

  const handleSave = async () => {
    if (!form.trader_name?.trim()) { toast.error("Trader name is required"); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        await supabase.from('traders').insert([form]);
        toast.success(`${form.trader_name} added`);
      } else {
        await supabase.from('traders').update(form).eq('id', modal.id);
        toast.success(`${form.trader_name} updated`);
      }
      load(); setModal(null); setSaving(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Error saving trader");
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete ${t.trader_name}?`)) return;
    try {
      await supabase.from('traders').delete().eq('id', t.id);
      toast.success(`${t.trader_name} deleted`);
      load();
    } catch (error) {
      toast.error("Error deleting trader");
    }
  };

  const getRiskIcon = (level) => {
    if (level === "low") return Shield;
    if (level === "medium") return Zap;
    return TrendingUp;
  };

  return (
    <div className="space-y-6">
      <PageHeader user={user} title="Manage Traders" subtitle={`${traders.length} traders available`} />

      <Button onClick={openAdd} className="gradient-green text-white font-semibold glow-green-sm">
        <Plus className="w-4 h-4 mr-2" /> Add Trader
      </Button>

      <div className="grid gap-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-secondary rounded-2xl animate-pulse" />)
        ) : traders.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No traders yet. Add one above.</div>
        ) : (
          traders.map((t, i) => {
            const RiskIcon = getRiskIcon(t.risk_level);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base"
                      style={{ background: t.avatar_color }}>
                      {t.trader_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.trader_name}</p>
                      <p className="text-xs text-muted-foreground">{t.specialty}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                    t.risk_level === "low" ? "text-blue-400 bg-blue-400/10" :
                    t.risk_level === "medium" ? "text-yellow-400 bg-yellow-400/10" :
                    "text-red-400 bg-red-400/10"
                  }`}>
                    <RiskIcon className="w-3 h-3" />
                    {t.risk_level}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Total Profit", value: `+${t.total_profit_pct?.toFixed(1)}%` },
                    { label: "Win Rate", value: `${t.win_rate?.toFixed(1)}%` },
                    { label: "Trades", value: t.total_trades },
                  ].map(s => (
                    <div key={s.label} className="bg-secondary rounded-xl px-3 py-2 text-center">
                      <p className="text-sm font-bold font-mono">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{t.followers} followers</span>
                  <span className="text-foreground font-semibold">{t.profit_split_pct}% split</span>
                  <span>Min ${t.min_allocation}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => openEdit(t)} variant="outline" className="flex-1 text-xs">
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" onClick={() => handleDelete(t)} variant="outline" className="flex-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{modal === "add" ? "Add Trader" : `Edit ${form.trader_name}`}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Trader Name</label>
                <Input value={form.trader_name} onChange={(e) => setForm(p => ({ ...p, trader_name: e.target.value }))} placeholder="John Crypto" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Specialty</label>
                <Input value={form.specialty} onChange={(e) => setForm(p => ({ ...p, specialty: e.target.value }))} placeholder="Scalping" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Risk Level</label>
                <select value={form.risk_level} onChange={(e) => setForm(p => ({ ...p, risk_level: e.target.value }))}
                  className="w-full h-9 mt-1 rounded-md bg-secondary border border-border text-sm px-3">
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Total Profit (%)</label>
                <Input type="number" step="0.1" value={form.total_profit_pct} onChange={(e) => setForm(p => ({ ...p, total_profit_pct: parseFloat(e.target.value) }))} placeholder="25.5" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Win Rate (%)</label>
                <Input type="number" step="0.1" value={form.win_rate} onChange={(e) => setForm(p => ({ ...p, win_rate: parseFloat(e.target.value) }))} placeholder="65" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Total Trades</label>
                <Input type="number" value={form.total_trades} onChange={(e) => setForm(p => ({ ...p, total_trades: parseInt(e.target.value) }))} placeholder="125" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Followers</label>
                <Input type="number" value={form.followers} onChange={(e) => setForm(p => ({ ...p, followers: parseInt(e.target.value) }))} placeholder="42" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Profit Split (%)</label>
                <Input type="number" value={form.profit_split_pct} onChange={(e) => setForm(p => ({ ...p, profit_split_pct: parseInt(e.target.value) }))} placeholder="20" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Min Allocation ($)</label>
                <Input type="number" value={form.min_allocation} onChange={(e) => setForm(p => ({ ...p, min_allocation: parseInt(e.target.value) }))} placeholder="100" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Avatar Color</label>
                <Input type="color" value={form.avatar_color} onChange={(e) => setForm(p => ({ ...p, avatar_color: e.target.value }))} className="mt-1 h-9" />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-green text-white font-semibold">
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button onClick={() => setModal(null)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
