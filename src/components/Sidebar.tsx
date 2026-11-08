import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Building2,
  Sparkles,
  Bot,
  MessageSquareShare,
  Workflow,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  UserCheck,
  CircleDot,
  Zap,
  Compass,
  MessageSquare
} from 'lucide-react';
import { UserProfile } from '../types/crm';

export type ActiveTab =
  | 'dashboard'
  | 'central_whatsapp'
  | 'prospecting'
  | 'kanban'
  | 'leads'
  | 'ai_analysis'
  | 'ai_assistant'
  | 'whatsapp'
  | 'automations'
  | 'n8n'
  | 'proposals'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  whatsappStatus: 'aguardando_configuracao' | 'conectado' | 'erro';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  currentUser,
  availableUsers,
  onSwitchUser,
  whatsappStatus
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard Comercial', icon: <LayoutDashboard className="w-5 h-5" /> },
    {
      id: 'central_whatsapp',
      label: 'Central WhatsApp',
      icon: <MessageSquare className="w-5 h-5 text-amber-400" />,
      badge: 'Omnichannel'
    },
    { id: 'prospecting', label: 'Prospecção Local', icon: <Compass className="w-5 h-5 text-amber-400" />, badge: 'Taboão SBC' },
    { id: 'kanban', label: 'Funil Comercial (Kanban)', icon: <Kanban className="w-5 h-5" />, badge: '12 Etapas' },
    { id: 'leads', label: 'Base de Empresas', icon: <Building2 className="w-5 h-5" /> },
    { id: 'ai_analysis', label: 'Análise de Sites IA', icon: <Sparkles className="w-5 h-5 text-amber-400" />, badge: 'Audit B2B' },
    { id: 'ai_assistant', label: 'Assistente Comercial IA', icon: <Bot className="w-5 h-5 text-amber-300" /> },
    {
      id: 'whatsapp',
      label: 'WhatsApp Cloud API',
      icon: <MessageSquareShare className="w-5 h-5" />,
      badge: whatsappStatus === 'conectado' ? 'Ativo' : 'Setup'
    },
    { id: 'automations', label: 'Central de Automações', icon: <Zap className="w-5 h-5 text-amber-400" />, badge: 'Google Cloud' },
    { id: 'proposals', label: 'Propostas Comerciais', icon: <FileText className="w-5 h-5" /> },
    { id: 'audit', label: 'Segurança & LGPD', icon: <ShieldCheck className="w-5 h-5" /> }
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between bg-[#0e1014] border-r border-[#1f242d] transition-all duration-300 z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-[#1f242d]">
          {!collapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] via-[#c5a059] to-[#8c6b1a] p-[1.5px] shadow-lg shadow-amber-950/20 shrink-0">
                <div className="w-full h-full bg-[#0a0b0d] rounded-[10px] flex items-center justify-center">
                  <span className="font-extrabold text-sm text-[#f5e7a9] tracking-wider">FM</span>
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white tracking-wide truncate flex items-center gap-1.5">
                  FMWS <span className="text-[#d4af37] font-semibold">SALES</span>
                </h1>
                <p className="text-[11px] text-[#94a3b8] truncate font-medium">Fazer Meu Website</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c6b1a] p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0b0d] rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-xs text-[#f5e7a9]">FM</span>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#181b22] rounded-lg transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Switcher */}
        <div className="p-3 border-b border-[#1f242d] bg-[#121419]/50">
          {!collapsed ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium px-1">
                <span>OPERADOR ATIVO</span>
                <span className="text-amber-400/90 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {currentUser.roleLabel.split('/')[0]}
                </span>
              </div>
              <select
                aria-label="Selecionar operador ativo"
                value={currentUser.id}
                onChange={e => {
                  const u = availableUsers.find(user => user.id === e.target.value);
                  if (u) onSwitchUser(u);
                }}
                className="w-full bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500/60 transition cursor-pointer"
              >
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id} className="bg-[#121419] text-slate-200">
                    {user.name} ({user.roleLabel})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex justify-center" title={`${currentUser.name} (${currentUser.roleLabel})`}>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-semibold">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-2">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 to-transparent text-amber-300 border-l-2 border-[#d4af37]'
                    : 'text-slate-300 hover:text-white hover:bg-[#161920]'
                }`}
              >
                <div className={`${isActive ? 'text-[#d4af37]' : 'text-slate-400'}`}>{item.icon}</div>
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between text-left truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          item.badge === 'Setup'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            : item.badge === 'Ativo'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-[#1f242d] text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status & Brand Footer */}
      <div className="p-3 border-t border-[#1f242d] bg-[#0c0d10]">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CircleDot
                  className={`w-2 h-2 ${
                    whatsappStatus === 'conectado' ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400 fill-amber-400'
                  }`}
                />
                Meta Cloud API
              </span>
              <span className={whatsappStatus === 'conectado' ? 'text-emerald-400' : 'text-amber-400'}>
                {whatsappStatus === 'conectado' ? 'Online' : 'Aguardando'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#14171e] border border-[#222733] text-[11px] text-slate-400">
              <p className="font-semibold text-slate-200">Fazer Meu Website</p>
              <a
                href="https://fazermeuwebsite.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d4af37] hover:underline flex items-center gap-1 mt-0.5"
              >
                fazermeuwebsite.com.br <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Fazer Meu Website">
            <CircleDot
              className={`w-3 h-3 ${
                whatsappStatus === 'conectado' ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400 fill-amber-400'
              }`}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
