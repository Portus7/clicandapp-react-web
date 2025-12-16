import React, { useState, useRef } from 'react';
import {
    X, Check, Zap, Building2, Smartphone, ArrowRight,
    CreditCard, FileText, Layers, PlusCircle, Trash2, ExternalLink, Crown
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// --- CONFIGURACIÓN DE PLANES BASE ---
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

// --- CONFIGURACIÓN DE ADD-ONS (IDs STRIPE) ---
const ADDONS = {
    SUB_UNIT_STD: 'price_SUB_STD_ID', // 30€
    SUB_UNIT_VIP: 'price_SUB_VIP_ID', // 15€
    SLOT_UNIT_STD: 'price_SLOT_STD_ID', // 10€
    SLOT_UNIT_VIP: 'price_SLOT_VIP_ID'  // 5€
};

export default function SubscriptionModal({ onClose, token, accountInfo }) {
    const [activeTab, setActiveTab] = useState('new_subscription'); // Default a comprar
    const [loading, setLoading] = useState(false);

    // 1. Estado Actual del Cliente
    const currentSubsLimit = accountInfo?.limits?.max_subagencies || 0;
    const currentSlotsLimit = accountInfo?.limits?.max_slots || 0;
    const isEnterprise = currentSubsLimit >= 10;

    // 2. Calcular Precios Dinámicos
    const subPriceId = isEnterprise ? ADDONS.SUB_UNIT_VIP : ADDONS.SUB_UNIT_STD;
    const subDisplayPrice = isEnterprise ? "15€ (VIP)" : "30€";
    const slotPriceId = isEnterprise ? ADDONS.SLOT_UNIT_VIP : ADDONS.SLOT_UNIT_STD;
    const slotDisplayPrice = isEnterprise ? "5€ (VIP)" : "10€";

    // --- ACCIONES ---
    const handlePortal = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/payments/portal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert("Error al abrir portal");
        } catch (e) { alert("Error de conexión"); } finally { setLoading(false); }
    };

    const handlePurchase = async (priceId) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/payments/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ priceId })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert("Error: " + (data.error || "Fallo al iniciar pago"));
        } catch (e) { alert("Error de conexión"); } finally { setLoading(false); }
    };

    // --- RENDER ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-gray-200 dark:border-gray-800">

                {/* HEADER + TABS */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-center px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Suscripción</h2>
                                <p className="text-xs text-gray-500">Administra tus recursos y facturación.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex px-8 gap-8 overflow-x-auto no-scrollbar">
                        <TabButton id="new_subscription" label="Nueva Suscripción" active={activeTab} onClick={setActiveTab} highlight />
                        <TabButton id="my_subscriptions" label="Mis Servicios Activos" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="payment_methods" label="Métodos de Pago" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="invoices" label="Facturas" active={activeTab} onClick={setActiveTab} />
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-[#0B0D12]">

                    {/* --- TAB 1: NUEVA SUSCRIPCIÓN (Marketplace) --- */}
                    {activeTab === 'new_subscription' && (
                        <div className="max-w-5xl mx-auto space-y-12">

                            {/* A. ADD-ONS (Prioridad Alta) */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-yellow-500 fill-current" /> Ampliación Flexible
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Tarjeta Subagencia */}
                                    <AddonCard
                                        title="Subcuenta Adicional"
                                        desc="Incluye +5 Slots WhatsApp gratis."
                                        price={subDisplayPrice}
                                        icon={Building2}
                                        color="indigo"
                                        features={['Acceso CRM completo', 'Gestión independiente', '5 Números incluidos']}
                                        onBuy={() => handlePurchase(subPriceId)}
                                    />
                                    {/* Tarjeta Slot */}
                                    <AddonCard
                                        title="WhatsApp Adicional"
                                        desc="Añade más números a cualquier subcuenta."
                                        price={slotDisplayPrice}
                                        icon={Smartphone}
                                        color="emerald"
                                        features={['Línea dedicada', 'Multi-dispositivo', 'Reconexión automática']}
                                        onBuy={() => handlePurchase(slotPriceId)}
                                    />
                                </div>
                            </div>

                            {/* B. PLANES BASE (Upgrades) */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Crown size={18} className="text-indigo-600" /> Niveles de Suscripción
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {BASE_PLANS.map((plan) => {
                                        const isCurrent = plan.limits.subs === currentSubsLimit && plan.limits.slots === currentSlotsLimit;
                                        const isDowngrade = plan.limits.subs < currentSubsLimit;

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

                                                {/* Botón Principal (Solo si NO es downgrade ni actual) */}
                                                {!isCurrent && !isDowngrade && (
                                                    <button
                                                        onClick={() => handlePurchase(plan.id)}
                                                        className={`mt-8 w-full py-3 rounded-xl font-bold transition-all text-white hover:opacity-90 hover:scale-[1.02] ${plan.color}`}
                                                    >
                                                        Mejorar a {plan.name}
                                                    </button>
                                                )}

                                                {/* Mensaje o Botón Discreto para Downgrade */}
                                                {isDowngrade && (
                                                    <button
                                                        onClick={() => handlePurchase(plan.id)}
                                                        className="mt-8 w-full py-3 text-sm text-gray-400 hover:text-gray-600 underline decoration-dotted"
                                                    >
                                                        Reducir a {plan.name}
                                                    </button>
                                                )}

                                                {isCurrent && (
                                                    <button disabled className="mt-8 w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-400 cursor-default">
                                                        Plan Activo
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* --- TAB 2: MIS SUSCRIPCIONES (Resumen Visual) --- */}
                    {activeTab === 'my_subscriptions' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resumen de Recursos</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Subagencias Activas</p>
                                        <p className="text-3xl font-extrabold text-indigo-600">{accountInfo?.limits?.used_subagencies} / {currentSubsLimit}</p>
                                        <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden"><div style={{ width: `${Math.min(100, (accountInfo?.limits?.used_subagencies / currentSubsLimit) * 100)}%` }} className="bg-indigo-500 h-full"></div></div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Slots WhatsApp</p>
                                        <p className="text-3xl font-extrabold text-emerald-600">{accountInfo?.limits?.used_slots} / {currentSlotsLimit}</p>
                                        <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden"><div style={{ width: `${Math.min(100, (accountInfo?.limits?.used_slots / currentSlotsLimit) * 100)}%` }} className="bg-emerald-500 h-full"></div></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button onClick={handlePortal} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2">
                                    <Trash2 size={16} /> Cancelar Suscripción
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- TABS 3 & 4: REDIRECCIÓN SEGURA --- */}
                    {(activeTab === 'payment_methods' || activeTab === 'invoices') && (
                        <div className="max-w-2xl mx-auto text-center py-20">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                {activeTab === 'invoices' ? <FileText size={40} className="text-gray-400" /> : <CreditCard size={40} className="text-gray-400" />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {activeTab === 'invoices' ? 'Historial de Facturación' : 'Métodos de Pago'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">
                                Por seguridad, esta información se gestiona en nuestro portal encriptado.
                            </p>
                            <button
                                onClick={handlePortal}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center gap-2 mx-auto"
                            >
                                <ExternalLink size={18} /> Ir al Portal Seguro
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTES ---

const TabButton = ({ id, label, active, onClick, highlight }) => (
    <button
        onClick={() => onClick(id)}
        className={`relative pb-4 px-2 text-sm font-bold transition-colors whitespace-nowrap outline-none
            ${active === id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
        `}
    >
        {label}
        {active === id && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></span>
        )}
        {highlight && active !== id && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full"></span>
        )}
    </button>
);

const AddonCard = ({ title, desc, price, icon: Icon, color, features, onBuy }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
        <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
                <div className={`p-3 rounded-lg ${color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 ml-14">
                {features.map((f, i) => (
                    <span key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Check size={12} className="text-indigo-500" /> {f}
                    </span>
                ))}
            </div>
        </div>

        <div className="text-center min-w-[140px] border-l border-gray-100 dark:border-gray-700 pl-6">
            <div className="mb-3">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white block">{price}</span>
                <span className="text-xs text-gray-400 font-medium">/mensual</span>
            </div>
            <button
                onClick={onBuy}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
            >
                <PlusCircle size={16} /> Añadir
            </button>
        </div>
    </div>
);