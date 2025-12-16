import React, { useRef } from 'react';
import { X, Check, Zap, Building2, Smartphone, ArrowRight, TrendingUp, Crown, PlusCircle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// --- CONFIGURACIÓN DE PRECIOS STRIPE ---
// 1. Planes Base (Suscripciones Mensuales que definen el Tier)
const BASE_PLANS = [
    {
        id: 'price_REGULAR_ID', // ⚠️ PON TU ID REAL
        name: 'Regular',
        price: '20€',
        limits: { subs: 1, slots: 5 },
        features: ['1 Subagencia', '5 Slots'],
        color: 'bg-blue-500'
    },
    {
        id: 'price_PRO_ID', // ⚠️ PON TU ID REAL
        name: 'Agencia Pro',
        price: '100€',
        limits: { subs: 5, slots: 25 },
        features: ['5 Subagencias', '25 Slots', 'Marca Blanca'],
        color: 'bg-indigo-600',
        recommended: true
    },
    {
        id: 'price_ENTERPRISE_ID', // ⚠️ PON TU ID REAL
        name: 'Enterprise',
        price: '250€',
        limits: { subs: 10, slots: 50 },
        features: ['10+ Subagencias', '50+ Slots', 'API', 'Descuento en Extras'],
        color: 'bg-purple-600'
    }
];

// 2. Add-ons (Productos de pago único o suscripción adicional)
const ADDONS = {
    SLOT_UNIT: 'price_SLOT_NORMAL_ID',       // ⚠️ ID para 1 Slot (Precio Normal)
    SLOT_UNIT_DISCOUNT: 'price_SLOT_VIP_ID', // ⚠️ ID para 1 Slot (Precio Reducido Enterprise)
    SUB_UNIT: 'price_SUB_UNIT_ID'            // ⚠️ ID para 1 Subagencia extra
};

export default function SubscriptionModal({ onClose, token, accountInfo }) {
    const plansRef = useRef(null);

    // --- 1. LÓGICA DE ESTADO ACTUAL ---
    const currentSubsLimit = accountInfo?.limits?.max_subagencies || 0;
    const currentSlotsLimit = accountInfo?.limits?.max_slots || 0;

    // Determinamos si es "Enterprise" (Ejemplo: Si tiene 10 o más subagencias base)
    const isEnterprise = currentSubsLimit >= 10;

    // Calculamos el ID de precio dinámico para Slots
    // Si es Enterprise, usa el precio con descuento, sino el normal.
    const slotPriceId = isEnterprise ? ADDONS.SLOT_UNIT_DISCOUNT : ADDONS.SLOT_UNIT;

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
                            {isEnterprise ? "Panel Enterprise" : "Gestión de Servicios"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {isEnterprise
                                ? "Tienes acceso a tarifas reducidas y ampliación unitaria."
                                : "Mejora tu plan para desbloquear la compra unitaria de recursos."}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* CONTENIDO */}
                <div className="overflow-y-auto p-8 bg-gray-50 dark:bg-[#0B0D12]">

                    {/* --- SECCIÓN A: MIS RECURSOS ACTIVOS --- */}
                    <div className="mb-10">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap size={16} /> Recursos Disponibles
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* TARJETA SUBCUENTAS */}
                            <ResourceCard
                                icon={Building2}
                                title="Subagencias"
                                current={accountInfo?.limits?.used_subagencies}
                                max={currentSubsLimit}
                                color="indigo"
                                // Solo permitimos ampliar por unidad si es Enterprise
                                onAdd={isEnterprise ? () => handlePurchase(ADDONS.SUB_UNIT) : null}
                                addLabel="+1 Subagencia (50€)"
                                isLocked={!isEnterprise}
                            />

                            {/* TARJETA SLOTS (NÚMEROS) */}
                            <ResourceCard
                                icon={Smartphone}
                                title="Conexiones WhatsApp"
                                current={accountInfo?.limits?.used_slots}
                                max={currentSlotsLimit}
                                color="emerald"
                                // Solo permitimos ampliar por unidad si es Enterprise
                                onAdd={isEnterprise ? () => handlePurchase(slotPriceId) : null}
                                addLabel={isEnterprise ? "+1 Slot (5€ - VIP)" : "+1 Slot"}
                                isLocked={!isEnterprise}
                            />
                        </div>
                    </div>

                    {/* --- SECCIÓN B: CAMBIAR PLAN BASE --- */}
                    <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-center text-xl font-bold text-gray-900 dark:text-white mb-8">
                            Niveles de Suscripción
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {BASE_PLANS.map((plan) => {
                                const isCurrent = plan.limits.subs === currentSubsLimit && plan.limits.slots === currentSlotsLimit;

                                return (
                                    <div key={plan.id} className={`relative flex flex-col p-6 rounded-2xl transition-all duration-300 border ${isCurrent ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>

                                        {isCurrent && (
                                            <div className="absolute top-4 right-4 text-emerald-600 font-bold text-xs bg-emerald-100 px-2 py-1 rounded">ACTUAL</div>
                                        )}

                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                        <div className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white">{plan.price} <span className="text-sm font-normal text-gray-500">/mes</span></div>

                                        <ul className="mt-6 space-y-3 flex-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Check size={16} className="text-emerald-500" /> {f}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => !isCurrent && handlePurchase(plan.id)}
                                            disabled={isCurrent}
                                            className={`mt-8 w-full py-3 rounded-xl font-bold transition-all ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : `${plan.color} text-white hover:opacity-90 hover:scale-[1.02]`}`}
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

// Subcomponente para Tarjeta de Recurso
function ResourceCard({ icon: Icon, title, current, max, color, onAdd, addLabel, isLocked }) {
    const percent = Math.min((current / max) * 100, 100);
    const colorClasses = {
        indigo: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30',
        emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{current} / {max} en uso</p>
                    </div>
                </div>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 bg-${color}-500`} style={{ width: `${percent}%` }}></div>
            </div>

            {/* Botón de Acción */}
            {onAdd ? (
                <button
                    onClick={onAdd}
                    className="w-full py-2.5 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition flex items-center justify-center gap-2"
                >
                    <PlusCircle size={16} /> {addLabel}
                </button>
            ) : (
                <div className="w-full py-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-xs font-medium text-center flex items-center justify-center gap-2 cursor-not-allowed" title="Necesitas plan Enterprise para añadir unidades sueltas">
                    <Crown size={14} className="text-gray-300" /> Ampliación unitaria bloqueada
                </div>
            )}
        </div>
    );
}