import React, { useRef } from 'react';
import { X, Check, Zap, Building2, Smartphone, ArrowRight, TrendingUp, Crown, PlusCircle, Star } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// --- CONFIGURACIÓN DE PRODUCTOS ---
const BASE_PLANS = [
    {
        id: 'price_REGULAR_ID',
        name: 'Regular',
        price: '20€',
        limits: { subs: 1, slots: 5 },
        features: ['1 Subagencia', '5 Slots'],
        color: 'bg-blue-500'
    },
    {
        id: 'price_PRO_ID',
        name: 'Agencia Pro',
        price: '100€',
        limits: { subs: 5, slots: 25 },
        features: ['5 Subagencias', '25 Slots', 'Marca Blanca'],
        color: 'bg-indigo-600',
        recommended: true
    },
    {
        id: 'price_ENTERPRISE_ID',
        name: 'Enterprise',
        price: '250€',
        limits: { subs: 10, slots: 50 },
        features: ['10+ Subagencias', '50+ Slots', 'API', 'Descuento en Extras'],
        color: 'bg-purple-600'
    }
];

// IDs DE STRIPE PARA EXTRAS (Precios Standard vs VIP)
const ADDONS = {
    // Subagencia (Incluye +5 Slots)
    SUB_UNIT_STD: 'price_SUB_STD_ID', // Precio Normal (ej: 30€)
    SUB_UNIT_VIP: 'price_SUB_VIP_ID', // Precio Enterprise (ej: 15€)

    // Slot Suelto
    SLOT_UNIT_STD: 'price_SLOT_STD_ID', // Precio Normal (ej: 10€)
    SLOT_UNIT_VIP: 'price_SLOT_VIP_ID'  // Precio Enterprise (ej: 5€)
};

export default function SubscriptionModal({ onClose, token, accountInfo }) {
    const plansRef = useRef(null);

    // 1. Estado Actual
    const currentSubsLimit = accountInfo?.limits?.max_subagencies || 0;
    const currentSlotsLimit = accountInfo?.limits?.max_slots || 0;

    // 2. Determinar si es Enterprise (>= 10 subagencias)
    const isEnterprise = currentSubsLimit >= 10;

    // 3. Calcular Precios y IDs dinámicos
    const subPriceId = isEnterprise ? ADDONS.SUB_UNIT_VIP : ADDONS.SUB_UNIT_STD;
    const subDisplayPrice = isEnterprise ? "15€ (VIP)" : "30€";

    const slotPriceId = isEnterprise ? ADDONS.SLOT_UNIT_VIP : ADDONS.SLOT_UNIT_STD;
    const slotDisplayPrice = isEnterprise ? "5€ (VIP)" : "10€";

    const handlePurchase = async (priceId) => {
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
            if (data.url) window.location.href = data.url;
            else alert("Error: " + (data.error || "Fallo al iniciar pago"));
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-200 dark:border-gray-800">

                {/* HEADER */}
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-20">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {isEnterprise ? <Crown className="text-yellow-500" fill="currentColor" /> : <TrendingUp className="text-indigo-600" />}
                            Gestión de Recursos
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {isEnterprise
                                ? "✨ Estado Enterprise: Disfrutas de tarifas reducidas en ampliaciones."
                                : "💡 Tip: Al llegar a 10 subagencias, obtendrás precios reducidos en extras."}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* CONTENIDO */}
                <div className="overflow-y-auto p-8 bg-gray-50 dark:bg-[#0B0D12]">

                    {/* --- SECCIÓN A: AMPLIACIÓN RÁPIDA (ADD-ONS) --- */}
                    <div className="mb-12">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap size={16} /> Ampliación Flexible
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* TARJETA 1: SUBCUENTAS (+5 SLOTS) */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-colors">
                                <div className="absolute top-0 right-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                                    INCLUYE 5 SLOTS GRATIS
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Nueva Subagencia</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Uso: {accountInfo?.limits?.used_subagencies} / {currentSubsLimit}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePurchase(subPriceId)}
                                    className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                                >
                                    <PlusCircle size={18} />
                                    Agregar por {subDisplayPrice} /mes
                                </button>
                            </div>

                            {/* TARJETA 2: SLOTS SUELTOS */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between group hover:border-emerald-400 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                                            <Smartphone size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Slot WhatsApp Extra</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Uso: {accountInfo?.limits?.used_slots} / {currentSlotsLimit}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePurchase(slotPriceId)}
                                    className="w-full py-3 rounded-lg border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition flex items-center justify-center gap-2"
                                >
                                    <PlusCircle size={18} />
                                    Agregar por {slotDisplayPrice} /mes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- SECCIÓN B: CAMBIO DE PLAN BASE --- */}
                    <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-center text-xl font-bold text-gray-900 dark:text-white mb-8">
                            Niveles de Suscripción Base
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {BASE_PLANS.map((plan) => {
                                const isCurrent = plan.limits.subs === currentSubsLimit && plan.limits.slots === currentSlotsLimit;

                                return (
                                    <div key={plan.id} className={`relative flex flex-col p-6 rounded-2xl transition-all duration-300 border ${isCurrent ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>

                                        {isCurrent && (
                                            <div className="absolute top-4 right-4 text-emerald-600 font-bold text-xs bg-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                                                <Check size={12} /> ACTUAL
                                            </div>
                                        )}

                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                        <div className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white">{plan.price} <span className="text-sm font-normal text-gray-500">/mes</span></div>

                                        <ul className="mt-6 space-y-3 flex-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <div className={`mt-0.5 p-0.5 rounded-full ${isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => !isCurrent && handlePurchase(plan.id)}
                                            disabled={isCurrent}
                                            className={`mt-8 w-full py-3 rounded-xl font-bold transition-all ${isCurrent ? 'bg-transparent text-emerald-600 border border-emerald-200 cursor-default' : `${plan.color} text-white hover:opacity-90 hover:scale-[1.02]`}`}
                                        >
                                            {isCurrent ? "Plan Activo" : `Cambiar a ${plan.name}`}
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