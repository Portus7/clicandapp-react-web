import React, { useRef } from 'react';
import { X, Check, Zap, Building2, Smartphone, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// ⚠️ IMPORTANTE: Configura aquí tus IDs de PRECIO de Stripe (empiezan por 'price_')
const PLANS = [
    {
        id: 'price_1Q...', // ID Plan Regular
        name: 'Regular',
        price: '20€',
        period: '/mes',
        limits: { subs: 1, slots: 5 },
        features: ['1 Subagencia', '5 Números WhatsApp', 'Soporte Básico'],
        color: 'bg-blue-500',
        recommended: false
    },
    {
        id: 'price_1Sez557Mhd9qo6A8oUCnFP1c', // ID Plan Agencia Pro
        name: 'Agencia Pro',
        price: '100€',
        period: '/mes',
        limits: { subs: 5, slots: 25 },
        features: ['5 Subagencias', '25 Números WhatsApp', 'Soporte Prioritario', 'Marca Blanca'],
        color: 'bg-indigo-600',
        recommended: true
    },
    {
        id: 'price_TIER2...', // ID Plan Enterprise
        name: 'Enterprise',
        price: '250€',
        period: '/mes',
        limits: { subs: 10, slots: 50 },
        features: ['10 Subagencias', '50 Números WhatsApp', 'API Dedicada', 'Onboarding VIP'],
        color: 'bg-purple-600',
        recommended: false
    }
];

export default function SubscriptionModal({ onClose, token, accountInfo }) {
    const plansRef = useRef(null);

    // 1. Obtener límites actuales del usuario
    const currentSubs = accountInfo?.limits?.max_subagencies || 0;
    const currentSlots = accountInfo?.limits?.max_slots || 0;
    const usedSubs = accountInfo?.limits?.used_subagencies || 0;
    const usedSlots = accountInfo?.limits?.used_slots || 0;

    // 2. Definir los "Productos" activos basados en esos límites
    const activeProducts = [
        {
            id: 'subs',
            title: 'Licencias de Subagencia',
            limit: currentSubs,
            usage: usedSubs,
            icon: Building2,
            description: 'Capacidad para gestionar clientes/ubicaciones.',
            color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30'
        },
        {
            id: 'slots',
            title: 'Conexiones de WhatsApp',
            limit: currentSlots,
            usage: usedSlots,
            icon: Smartphone,
            description: 'Slots totales para vincular números.',
            color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
        }
    ];

    const handleSubscribe = async (priceId) => {
        try {
            const res = await fetch(`${API_URL}/payments/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ priceId })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error: " + (data.error || "No se pudo iniciar el pago"));
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    const scrollToPlans = () => {
        plansRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-200 dark:border-gray-800">

                {/* HEADER */}
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-20">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="text-indigo-600" /> Mis Servicios Activos
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gestiona y escala tus recursos contratados.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* CONTENIDO CON SCROLL */}
                <div className="overflow-y-auto p-8 bg-gray-50 dark:bg-[#0B0D12]">

                    {/* SECCIÓN 1: LISTADO DE PRODUCTOS ACTIVOS (LO QUE PEDISTE) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {activeProducts.map((prod) => (
                            <div key={prod.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300">

                                {/* Fondo decorativo */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex gap-5">
                                        {/* Icono */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${prod.color} shadow-sm`}>
                                            <prod.icon size={28} />
                                        </div>

                                        {/* Info Texto */}
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{prod.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wide border border-emerald-200 dark:border-emerald-500/30">
                                                    Activo
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    {prod.limit} Unidades
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-2">{prod.description}</p>
                                        </div>
                                    </div>

                                    {/* BOTÓN "+" DE AMPLIAR */}
                                    <button
                                        onClick={scrollToPlans}
                                        className="flex flex-col items-center gap-1 group/btn"
                                        title="Ampliar capacidad"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 transition-all transform group-hover/btn:scale-110 group-hover/btn:bg-indigo-500 active:scale-95">
                                            <Zap size={20} fill="currentColor" />
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover/btn:opacity-100 transition-opacity absolute top-12">
                                            Ampliar
                                        </span>
                                    </button>
                                </div>

                                {/* Barra de Progreso Visual */}
                                <div className="mt-6">
                                    <div className="flex justify-between text-xs font-semibold mb-1.5 text-gray-500 dark:text-gray-400">
                                        <span>Uso actual</span>
                                        <span>{Math.round((prod.usage / prod.limit) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gray-900 dark:bg-gray-300 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((prod.usage / prod.limit) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SECCIÓN 2: PLANES DISPONIBLES (Al hacer clic en +) */}
                    <div ref={plansRef} className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <div className="text-center mb-10">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Opciones de Ampliación</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Elige un plan superior para aumentar tus límites al instante.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {PLANS.map((plan) => {
                                // Lógica para saber si es el plan actual o una mejora
                                const isCurrent = plan.limits.subs === currentSubs && plan.limits.slots === currentSlots;
                                const isUpgrade = plan.limits.subs > currentSubs;
                                const isDowngrade = plan.limits.subs < currentSubs;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative flex flex-col p-6 rounded-2xl transition-all duration-300 
                                            ${isCurrent
                                                ? 'border-2 border-emerald-500 bg-emerald-50/10 dark:bg-emerald-900/10'
                                                : plan.recommended
                                                    ? 'border-2 border-indigo-500 bg-white dark:bg-gray-800 shadow-xl scale-105 z-10'
                                                    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'
                                            }`}
                                    >
                                        {/* Badge Recomendado */}
                                        {plan.recommended && !isCurrent && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                                                Más Popular
                                            </div>
                                        )}

                                        {/* Badge Actual */}
                                        {isCurrent && (
                                            <div className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                                                <Check size={14} /> PLAN ACTUAL
                                            </div>
                                        )}

                                        <div className="mb-6">
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                            <div className="flex items-baseline mt-2">
                                                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                                <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm font-medium">{plan.period}</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-4 mb-8 flex-1">
                                            {plan.features.map((feat, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                    <div className={`mt-0.5 p-0.5 rounded-full ${isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => !isCurrent && handleSubscribe(plan.id)}
                                            disabled={isCurrent}
                                            className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                                ${isCurrent
                                                    ? 'bg-transparent border border-emerald-500 text-emerald-600 cursor-default opacity-80'
                                                    : isDowngrade
                                                        ? 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        : `${plan.color} text-white shadow-lg hover:opacity-90 hover:-translate-y-1 active:scale-95`
                                                }`}
                                        >
                                            {isCurrent ? (
                                                <>Tu Plan Actual</>
                                            ) : isUpgrade ? (
                                                <>Elegir {plan.name} <ArrowRight size={18} /></>
                                            ) : (
                                                <>Cambiar a {plan.name}</>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}