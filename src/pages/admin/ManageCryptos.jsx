import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/api/supabaseClient";
import PageHeader from "@/components/ui/PageHeader";
import { CoinIcon } from "@/components/ui/CryptoRow";
import { toast } from "sonner";

const EMPTY = { symbol: "", name: "", price: "", change_24h: "", market_cap: "", volume_24h: "", is_active: true };

export default function ManageCryptos() {
  const { user } = useOutletContext();
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | crypto object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data, error } = await supabase.from('cryptocurrencies').select('*');
      if (error) throw error;
      setCryptos(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = (c) => { setForm({ ...c, price: c.price?.toString(), change_24h: c.change_24h?.toString(), market_cap: c.market_cap?.toString(), volume_24h: c.volume_24h?.toString() }); setModal(c); };

  const handleSave = async () => {
    if (!form.symbol || !form.name || !form.price) { toast.error("Symbol, name and price are required"); return; }
    setSaving(true);
    const data = { ...form, price: parseFloat(form.price), change_24h: parseFloat(form.change_24h) || 0, market_cap: parseFloat(form.market_cap) || 0, volume_24h: parseFloat(form.volume_24h) || 0 };
    try {
      if (modal === "add") {
        await supabase.from('cryptocurrencies').insert([data]);
        toast.success(`${form.symbol} added`);
      } else {
        await supabase.from('cryptocurrencies').update(data).eq('id', modal.id);
        toast.success(`${form.symbol} updated`);
      }
      load(); setModal(null); setSaving(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Error saving cryptocurrency");
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete ${c.symbol}?`)) return;
    try {
      await supabase.from('cryptocurrencies').delete().eq('id', c.id);
      toast.success(`${c.symbol} deleted`);
      load();
    } catch (error) {
      toast.error("Error deleting cryptocurrency");
    }
  };

  const handleToggle = async (c) => {
    try {
      await supabase.from('cryptocurrencies').update({ is_active: !c.is_active }).eq('id', c.id);
      load();
    } catch (error) {
      toast.error("Error updating cryptocurrency");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader user={user} title="Cryptocurrencies" subtitle={`${cryptos.length} coins listed`} />

      <Button onClick={openAdd} className="gradient-green text-white font-semibold glow-green-sm">
        <Plus className="w-4 h-4 mr-2" /> Add Cryptocurrency
      </Button>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <span className="col-span-2">Coin</span>
          <span className="text-right">Price</span>
          <span className="text-center">Status</span>
          <span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="space-y-px">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-secondary/30 animate-pulse" />)}</div>
        ) : cryptos.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No cryptocurrencies. Add one above.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {cryptos.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="grid grid-cols-5 gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors items-center">
                <div className="col-span-2 flex items-center gap-2">
                  <CoinIcon symbol={c.symbol} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold tabular-nums">${c.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className={`text-xs font-semibold ${c.change_24h >= 0 ? "text-up" : "text-down"}`}>{c.change_24h >= 0 ? "+" : ""}{c.change_24h?.toFixed(2)}%</p>
                </div>
                <div className="flex justify-center">
                  {c.is_active
                    ? <div className="flex items-center gap-1 text-xs font-semibold text-up px-2 py-1 rounded-lg bg-up"><CheckCircle className="w-3.5 h-3.5" /> Active</div>
                    : <div className="flex items-center gap-1 text-xs font-semibold text-down px-2 py-1 rounded-lg bg-down"><XCircle className="w-3.5 h-3.5" /> Inactive</div>
                  }
                </div>
                <div className="flex gap-1.5 justify-end">
                  <Button size="sm" onClick={() => openEdit(c)} className="h-7 px-2 text-xs" variant="outline">
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" onClick={() => handleToggle(c)} className="h-7 px-2 text-xs" variant="outline">
                    {c.is_active ? <XCircle className="w-3 h-3 text-down" /> : <CheckCircle className="w-3 h-3 text-up" />}
                  </Button>
                  <Button size="sm" onClick={() => handleDelete(c)} className="h-7 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10" variant="outline">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{modal === "add" ? "Add Cryptocurrency" : `Edit ${form.symbol}`}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Symbol</label>
                <Input value={form.symbol} onChange={(e) => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} placeholder="BTC" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Bitcoin" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Price (USD)</label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} placeholder="45000" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">24h Change (%)</label>
                <Input type="number" step="0.01" value={form.change_24h} onChange={(e) => setForm(p => ({ ...p, change_24h: e.target.value }))} placeholder="2.5" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Market Cap (USD)</label>
                <Input type="number" step="0.01" value={form.market_cap} onChange={(e) => setForm(p => ({ ...p, market_cap: e.target.value }))} placeholder="900000000000" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">24h Volume (USD)</label>
                <Input type="number" step="0.01" value={form.volume_24h} onChange={(e) => setForm(p => ({ ...p, volume_24h: e.target.value }))} placeholder="30000000000" className="mt-1" />
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
