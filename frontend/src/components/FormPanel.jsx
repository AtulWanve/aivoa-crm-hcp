import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Lock, CheckCircle, User, Calendar, Clock, Activity, Package, Users,
  MessageSquare, AlertCircle, Share2, ArrowRight, Send, X, Loader2, Sparkles } from 'lucide-react';
import { clearForm } from '../store/formSlice';

const FIELD_META = [
  { key: 'hcp_name',            label: 'HCP Name',               icon: User,          span: 1, required: true },
  { key: 'interaction_date',    label: 'Interaction Date',        icon: Calendar,      span: 1 },
  { key: 'interaction_type',    label: 'Interaction Type',        icon: Activity,      span: 1 },
  { key: 'time',                label: 'Time',                    icon: Clock,         span: 1 },
  { key: 'sentiment',           label: 'Sentiment',               icon: Activity,      span: 1 },
  { key: 'samples_distributed', label: 'Samples Distributed',     icon: Package,       span: 1 },
  { key: 'attendees',           label: 'Attendees',               icon: Users,         span: 2 },
  { key: 'topics_discussed',    label: 'Topics Discussed',        icon: MessageSquare, span: 2, textarea: true },
  { key: 'outcomes',            label: 'Outcomes / Adverse Events',icon: AlertCircle,  span: 2, textarea: true },
  { key: 'materials_shared',    label: 'Materials Shared',        icon: Share2,        span: 2 },
  { key: 'follow_up_actions',   label: 'Follow-up Actions',       icon: ArrowRight,    span: 2, textarea: true },
];

const SENTIMENT_COLORS = {
  positive:   'text-emerald-400',
  negative:   'text-rose-400',
  neutral:    'text-amber-400',
  interested: 'text-sky-400',
};

const getSentimentClass = (val) => {
  const lower = (val || '').toLowerCase();
  for (const [k, cls] of Object.entries(SENTIMENT_COLORS)) {
    if (lower.includes(k)) return cls;
  }
  return 'text-indigo-300';
};

const FormPanel = () => {
  const formData  = useSelector((state) => state.form);
  const dispatch  = useDispatch();
  const [tooltip,    setTooltip]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(null); // holds success response

  const filledCount = Object.values(formData).filter(Boolean).length;
  const totalCount  = Object.keys(formData).length;
  const progress    = Math.round((filledCount / totalCount) * 100);
  const canSubmit   = Boolean(formData.hcp_name); // minimum: HCP name must be set

  const handleLockClick = () => {
    if (!canSubmit) {
      setTooltip(true);
      setTimeout(() => setTooltip(false), 2500);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/interactions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(data);
      }
    } catch (err) {
      console.error('Submit error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(null);
    dispatch(clearForm());
  };

  return (
    <div className="h-full flex flex-col bg-[#0f1117] relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-10 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Success Modal ─────────────────────────────────────────────── */}
      {submitted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="bg-[#131620] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl slide-in">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <button onClick={handleReset} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Saved to CRM!</h3>
            <p className="text-slate-400 text-sm mb-4">{submitted.message}</p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-5 space-y-1.5">
              {Object.entries(submitted.data)
                .filter(([k]) => !['submitted_at','id'].includes(k) && submitted.data[k])
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-slate-500 capitalize">{k.replace(/_/g,' ')}</span>
                    <span className="text-indigo-300 font-medium max-w-[60%] text-right truncate">{String(v)}</span>
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ai-gradient hover:opacity-90 transition-opacity"
              >
                Log New Interaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-indigo-400 pulse-dot" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">AI-Powered CRM</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Log HCP Interaction</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fields auto-populated by AI assistant</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-400">{progress}%</div>
            <div className="text-xs text-slate-500">Complete</div>
          </div>
        </div>
        <div className="mt-4 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-1.5">{filledCount} of {totalCount} fields filled</p>
      </div>

      {/* Lock tooltip */}
      {tooltip && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 slide-in">
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap">
            <Lock size={12} />
            Use the AI chat to populate this field
          </div>
        </div>
      )}

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          {FIELD_META.map(({ key, label, icon: Icon, span, textarea, required }) => {
            const value = formData[key];
            const filled = Boolean(value);
            return (
              <div
                key={key}
                className={`${span === 2 ? 'col-span-2' : 'col-span-1'} slide-in`}
                onClick={handleLockClick}
              >
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  <Icon size={11} className={filled ? 'text-indigo-400' : 'text-slate-600'} />
                  {label}
                  {required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
                <div className="relative group cursor-default">
                  {textarea ? (
                    <textarea
                      readOnly rows={3} value={value || ''}
                      className={`w-full px-3 py-2.5 pr-9 rounded-lg text-sm resize-none transition-all duration-300 outline-none border
                        ${filled
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-600'}`}
                      placeholder="Waiting for AI..."
                    />
                  ) : (
                    <input
                      readOnly type="text" value={value || ''}
                      className={`w-full px-3 py-2.5 pr-9 rounded-lg text-sm transition-all duration-300 outline-none border
                        ${filled
                          ? `bg-indigo-500/10 border-indigo-500/30 ${key === 'sentiment' ? getSentimentClass(value) : 'text-indigo-200'}`
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-600'}`}
                      placeholder="Waiting for AI..."
                    />
                  )}
                  <div className="absolute right-2.5 top-2.5">
                    {filled
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : <Lock size={14} className="text-slate-700" />
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300
            ${canSubmit && !submitting
              ? 'ai-gradient text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-indigo-500/20 cursor-pointer'
              : 'text-white/30 border border-white/[0.06] bg-white/[0.02] cursor-not-allowed'
            }`}
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> Saving to CRM...</>
          ) : canSubmit ? (
            <><Sparkles size={16} /> Submit Interaction to CRM</>
          ) : (
            <><Lock size={14} /> Fill HCP Name via AI to Enable Submit</>
          )}
        </button>
      </div>
    </div>
  );
};

export default FormPanel;
