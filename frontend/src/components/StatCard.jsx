import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export const StatCard = ({
  title,
  value,
  isCurrency = true,
  changePct,
  changeLabel = 'vs last month',
  icon: Icon,
  variant = 'brand', // 'brand' | 'emerald' | 'rose' | 'amber' | 'cyan'
  subtitle
}) => {
  const { formatMoney } = useCurrency();

  const variantStyles = {
    brand: {
      border: 'border-brand-500/20 hover:border-brand-500/40',
      iconBg: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
      glow: 'from-brand-500/10 via-transparent to-transparent'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      glow: 'from-emerald-500/10 via-transparent to-transparent'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      glow: 'from-rose-500/10 via-transparent to-transparent'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      glow: 'from-amber-500/10 via-transparent to-transparent'
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      glow: 'from-cyan-500/10 via-transparent to-transparent'
    }
  };

  const style = variantStyles[variant] || variantStyles.brand;

  return (
    <div className={`relative overflow-hidden p-6 rounded-2xl bg-navy-900/80 backdrop-blur-md border ${style.border} transition-all duration-200 hover:-translate-y-1 shadow-lg shadow-black/20 group`}>
      {/* Background Gradient Glow */}
      <div className={`absolute -right-12 -top-12 w-36 h-36 rounded-full bg-gradient-to-br ${style.glow} blur-2xl opacity-60 pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {isCurrency ? formatMoney(value) : value}
          </h3>
        </div>

        {Icon && (
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${style.iconBg} shadow-inner`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Footer / Delta */}
      <div className="mt-4 flex items-center gap-2 relative z-10 text-xs">
        {changePct !== undefined && changePct !== null ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                changePct > 0
                  ? variant === 'rose'
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                  : changePct < 0
                  ? variant === 'rose'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {changePct > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : changePct < 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {Math.abs(changePct)}%
            </span>
            <span className="text-slate-400">{changeLabel}</span>
          </div>
        ) : subtitle ? (
          <span className="text-slate-400">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
};
