import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/api/supabaseClient";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "sonner";

const TYPE_META = {
  deposit: { label: "Deposit", icon: ArrowDownLeft, color: "text-up bg-up" },
  withdrawal: { label: "Withdrawal", icon: ArrowUpRight, color: "text-down bg-down" },
  buy: { label: "Buy", icon: ArrowLeftRight, color: "text-blue-400 bg-blue-400/10" },
  sell: { label: "Sell", icon: ArrowLeftRight, color: "text-purple-400 bg-purple-400/10" },
  copy_profit: { label: "Copy Profit", icon: ArrowDownLeft, color: "text-up bg-up" },
};

const STATUS_META = {
  pending: { label: "Pending", icon: Clock, cls: "text-yellow-400 bg-yellow-400/10" },
  approved: { label: "Approved", icon: CheckCircle, cls: "text-up bg-up" },
  completed: { label: "Completed", icon: CheckCircle, cls: "text-up bg-up" },
  rejected: { label: "Rejected", icon: XCircle, cls: "text-down bg-down" },
};

export default function Transactions() {
  const { user } = useOutletContext();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // "deposit" | "withdraw"
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [depositAddresses, setDepositAddresses] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('platform_settings').select('*');
        if (error) throw error;
        const map = {};
        (data || []).forEach(r => { map[r.key] = r.value; });
        setDepositAddresses(map);
      } catch (error) {
        console.error('Settings load error:', error);
      }
    })();
  }, []);

  const load = async () => {
    if (!user?.email) return;
    try {
      const { data, error } = await supabase.from('transaction').select('*').eq('user_email', user.email).order('created_date', { ascending: false }).limit(50);
      if (error) throw error;
      setTxns(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const filtered = filter === "all" ? txns : txns.filter(t => t.type === filter);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (modal === "withdrawal" && !wallet) { toast.error("Enter your wallet address"); return; }
    setSubmitting(true);
    try {
      await supabase.from('transaction').insert([{
        user_email: user.email,
        type: modal,
        amount: parseFloat(amount),
        wallet_address: wallet || null,
        status: "pending",
        created_date: new Date()
      }]);
      toast.success(`${modal === "deposit" ? "Deposit" : "Withdrawal"} request submitted! Awaiting approval.`);
      setModal(null); setAmount(""); setWallet("");
      load();
      setSubmitting(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Error submitting request");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader user={user} title="Transactions" subtitle="Your complete transaction history" />

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button onClick={() => setModal("deposit")}
          className="gradient-green text-white font-semibold glow-green-sm">
          <ArrowDownLeft className="w-4 h-4 mr-2" /> Deposit
        </Button>
        <Button onClick={() => setModal("withdrawal")} variant="outline">
          <ArrowUpRight className="w-4 h-4 mr-2" /> Withdraw
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "deposit", "withdrawal", "buy", "sell", "copy_profit"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${filter === f ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f === "all" ? "All" : TYPE_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <span>Type</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Date</span>
          <span className="text-center">Status</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="space-y-px">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-secondary/30 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No transactions</div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((tx, i) => {
              const TypeIcon = TYPE_META[tx.type]?.icon || ArrowLeftRight;
              const StatusIcon = STATUS_META[tx.status]?.icon || Clock;
              return (
                <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-5 gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_META[tx.type]?.color || ""}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold capitalize">{tx.type?.replace("_"," ")}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold tabular-nums">${tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(tx.created_date).toLocaleDateString()}
                  </div>
                  <div className="flex justify-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 ${STATUS_META[tx.status]?.cls || ""}`}>
                      {(() => {
                        const StatusIcon = STATUS_META[tx.status]?.icon || Clock;
                        return <StatusIcon className="w-3 h-3" />;
                      })()}
                      {STATUS_META[tx.status]?.label || tx.status}
                    </span>
                  </div>
                  <div className="text-right">
                    {tx.status === "pending" && (
                      <span className="text-xs text-yellow-400 font-semibold">Awaiting</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{modal === "deposit" ? "Deposit Funds" : "Withdraw Funds"}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modal === "deposit" && depositAddresses.deposit_image_url && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img src={depositAddresses.deposit_image_url} alt="Deposit QR" className="w-full" />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Amount (USD)</label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="mt-1" />
              </div>

              {modal === "withdrawal" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Wallet Address</label>
                  <Input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="Your wallet address" className="mt-1" />
                </div>
              )}

              {modal === "deposit" && depositAddresses.deposit_address_btc && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Bitcoin Address</p>
                  <p className="text-xs font-mono break-all text-foreground">{depositAddresses.deposit_address_btc}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gradient-green text-white font-semibold">
                  {submitting ? "Processing..." : "Submit"}
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
