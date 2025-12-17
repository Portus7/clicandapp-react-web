import React, { useState, useEffect } from 'react';
import {
    Check, Zap, Building2, Smartphone,
    CreditCard, FileText, ExternalLink, Crown, AlertCircle,
    ArrowUpCircle, Plus, ChevronRight, Package, Shield, PlusCircle,
    TrendingUp, XCircle, Settings
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// --- CONFIGURACIÓN DE PLANES BASE ---
const BASE_PLANS = [
    {
        id: 'price_1SfJpk7Mhd9qo6A8AmFiKTdk',
        name: 'Plan Regular',
        price: '20€',
        limits: { subs: 1, slots: 5 },
        features: ['1 Agencia', '5 Números incluidos'],
        color: 'bg-blue-600',
        badge: 'Start'
    },
    {
        id: 'price_1SfJqb7Mhd9qo6A8zP0xydlX',
        name: 'Agencia Pro',
        price: '90€',
        limits: { subs: 5, slots: 25 },
        features: ['5 Agencias', '25 Números incluidos', 'Marca Blanca'],
        color: 'bg-indigo-600',
        recommended: true,
        badge: 'Popular'
    },
    {
        id: 'price_1SfJrZ7Mhd9qo6A8WOn6BGbJ',
        name: 'Enterprise',
        price: '200€',
        limits: { subs: 10, slots: 50 },
        features: ['10 Agencias', '50 Números incluidos', 'API', 'Descuento VIP en Extras'],
        color: 'bg-purple-600',
        badge: 'VIP'
    }
];

// --- ADD-ONS ---
const ADDONS = {
    SUB_UNIT_STD: 'price_1SfK2d7Mhd9qo6A8AI3ZkOQT',
    SUB_UNIT_VIP: 'price_1SfK547Mhd9qo6A8SfvT8GF4',
    SLOT_UNIT_STD: 'price_1SfK787Mhd9qo6A8WmPRs9Zy',
    SLOT_UNIT_VIP: 'price_1SfK827Mhd9qo6A89iZ68SRi'
};

// --- MAPEO DE DETALLES DE RECURSOS ---
const PLAN_DETAILS = {
    // Planes Base
    'price_1SfJpk7Mhd9qo6A8AmFiKTdk': { label: '1 Agencia / 5 Slots' },
    'price_1SfJqb7Mhd9qo6A8zP0xydlX': { label: '5 Agencias / 25 Slots' },
    'price_1SfJrZ7Mhd9qo6A8WOn6BGbJ': { label: '10 Agencias / 50 Slots' },

    // Add-ons (Subagencias)
    'price_1SfK2d7Mhd9qo6A8AI3ZkOQT': { label: '+1 Agencia / +5 Slots' },
    'price_1SfK547Mhd9qo6A8SfvT8GF4': { label: '+1 Agencia / +5 Slots' },

    // Add-ons (Slots)
    'price_1SfK787Mhd9qo6A8WmPRs9Zy': { label: '+1 Slot Extra' },
    'price_1SfK827Mhd9qo6A89iZ68SRi': { label: '+1 Slot Extra' }
};

export default function SubscriptionManager({ token, accountInfo }) {
    const [activeTab, setActiveTab] = useState('services'); // services | payments | invoices
    const [loading, setLoading] = useState(false);
    const [subscriptions, setSubscriptions] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [showPlans, setShowPlans] = useState(false);

    // --- CÁLCULO DE NIVEL Y DESCUENTOS ---
    const totalSubs = accountInfo?.limits?.max_subagencies || 0;
    const hasVolumeDiscount = totalSubs >= 10;

    const subPriceId = hasVolumeDiscount ? ADDONS.SUB_UNIT_VIP : ADDONS.SUB_UNIT_STD;
    const subDisplayPrice = hasVolumeDiscount ? "10€ (VIP)" : "20€";
    const slotPriceId = hasVolumeDiscount ? ADDONS.SLOT_UNIT_VIP : ADDONS.SLOT_UNIT_STD;
    const slotDisplayPrice = hasVolumeDiscount ? "3€ (VIP)" : "5€";

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        setFetching(true);
        try {
            const res = await fetch(`${API_URL}/payments/my-subscriptions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data);
                // Si no hay suscripciones, mostrar panel de planes automáticamente
                if (data.length === 0) setShowPlans(true);
            }
        } catch (e) { console.error(e); }
        finally { setFetching(false); }
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
            else alert("Error al iniciar pago: " + (data.error || "Desconocido"));
        } catch (e) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };

    const handlePortal = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/payments/portal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };

    // --- RENDERIZADO ---
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ENCABEZADO Y TABS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Suscripción y Facturación</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Administra tus planes, recursos y pagos.</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {['services', 'payments', 'invoices'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab === 'services' ? 'Mis Servicios' : tab === 'payments' ? 'Métodos de Pago' : 'Facturas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB: MIS SERVICIOS */}
            {activeTab === 'services' && (
                <div className="space-y-8">

                    {/* 1. LISTADO DE SERVICIOS */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Package size={20} className="text-indigo-500" /> Servicios Contratados
                            </h3>

                            {/* BOTÓN PARA CONTRATAR NUEVO PLAN (ACUMULABLE) */}
                            {subscriptions.length > 0 && (
                                <button
                                    onClick={() => setShowPlans(!showPlans)}
                                    className={`text-xs font-bold px-4 py-2 rounded-lg transition border flex items-center gap-2 
                                    ${showPlans
                                            ? 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                                            : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm'
                                        }`}
                                >
                                    {showPlans ? (
                                        <>Cerrar Catálogo <ChevronRight size={14} className="rotate-90" /></>
                                    ) : (
                                        <><Plus size={14} /> Contratar Nuevo Plan</>
                                    )}
                                </button>
                            )}
                        </div>

                        {fetching ? (
                            <div className="p-10 text-center text-gray-400 animate-pulse">Cargando información...</div>
                        ) : subscriptions.length === 0 ? (
                            /* ESTADO VACÍO */
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle size={32} className="text-gray-400" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tienes servicios activos</h4>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                                    Suscríbete a un plan para comenzar a gestionar tus agencias y dispositivos WhatsApp.
                                </p>
                                {!showPlans && (
                                    <button
                                        onClick={() => setShowPlans(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition transform hover:-translate-y-0.5 flex items-center gap-2"
                                    >
                                        <Plus size={20} /> Ver Planes Disponibles
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* LISTA CON DATOS */
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {subscriptions.map(sub => {
                                    const details = PLAN_DETAILS[sub.stripe_price_id];
                                    return (
                                        <div key={sub.id} className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                            {/* Info Principal */}
                                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                                <div className={`p-3 rounded-xl ${sub.type === 'base' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                    {sub.type === 'base' ? <Crown size={24} /> : <Zap size={24} />}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{sub.product_name}</h4>
                                                        {details && (
                                                            <span className="text-[10px] uppercase font-extrabold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded tracking-wide">
                                                                {details.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 rounded text-xs">ID: {sub.stripe_subscription_id?.slice(-8)}</span>
                                                        {sub.quantity > 1 && <span className="font-bold text-indigo-600 dark:text-indigo-400">x{sub.quantity} unidades</span>}

                                                        <span className={`inline-flex items-center gap-1 ml-2 text-xs font-bold capitalize ${sub.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                            {sub.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 🔥 BOTONES DE ACCIÓN (MEJORAR / CANCELAR) */}
                                            <div className="flex gap-3 w-full lg:w-auto justify-end">
                                                <button
                                                    onClick={handlePortal}
                                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40 rounded-lg transition border border-indigo-200 dark:border-indigo-800"
                                                    title="Cambiar a un plan superior o inferior"
                                                >
                                                    <TrendingUp size={14} /> Modificar Plan
                                                </button>

                                                <button
                                                    onClick={handlePortal}
                                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition border border-red-200 dark:border-red-900"
                                                    title="Dar de baja este servicio"
                                                >
                                                    <XCircle size={14} /> Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2. GRID DE PLANES BASE (CATÁLOGO) */}
                    {(showPlans || subscriptions.length === 0) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield size={18} className="text-indigo-500" /> Catálogo de Planes
                                </h3>
                                {subscriptions.length > 0 && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Estos planes se sumarán a tu suscripción actual.
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {BASE_PLANS.map((plan) => (
                                    <div key={plan.id} className={`relative bg-white dark:bg-gray-900 border rounded-2xl p-6 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 ${plan.recommended ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-800'}`}>
                                        {plan.recommended && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Más Popular</div>}

                                        <div className="mb-4">
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                                <span className="text-sm text-gray-500">/mes</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-3 mb-8 flex-1">
                                            {plan.features.map((feat, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Check size={16} className="text-emerald-500 shrink-0" /> {feat}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => handlePurchase(plan.id)}
                                            className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg shadow-indigo-200 dark:shadow-none ${plan.color} hover:opacity-90 active:scale-95`}
                                        >
                                            {loading ? 'Procesando...' : 'Contratar Plan'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. SECCIÓN ADD-ONS (Siempre visible si hay al menos un servicio) */}
                    {subscriptions.length > 0 && (
                        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <PlusCircle size={18} className="text-emerald-500" /> Complementos y Extras
                                {hasVolumeDiscount && <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold">Precios VIP Activos</span>}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Addon: Subagencia */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl flex items-center justify-between hover:border-indigo-300 transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">Subagencia Extra</h4>
                                            <p className="text-xs text-gray-500">+ Licencia GHL y 5 Slots WA</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{subDisplayPrice}</p>
                                        <button onClick={() => handlePurchase(subPriceId)} className="text-sm font-bold text-indigo-600 hover:underline">Añadir +</button>
                                    </div>
                                </div>

                                {/* Addon: Slot */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl flex items-center justify-between hover:border-emerald-300 transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                                            <Smartphone size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">WhatsApp Extra</h4>
                                            <p className="text-xs text-gray-500">+1 Número para cualquier cuenta</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{slotDisplayPrice}</p>
                                        <button onClick={() => handlePurchase(slotPriceId)} className="text-sm font-bold text-emerald-600 hover:underline">Añadir +</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: PAGOS Y FACTURAS (Redirección al Portal) */}
            {(activeTab === 'payments' || activeTab === 'invoices') && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                        {activeTab === 'payments' ? <CreditCard size={40} /> : <FileText size={40} />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {activeTab === 'payments' ? 'Gestión de Tarjetas' : 'Historial de Facturas'}
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Para tu seguridad, la información sensible de facturación se gestiona en nuestro portal encriptado de Stripe.
                    </p>
                    <button
                        onClick={handlePortal}
                        className="bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 mx-auto"
                    >
                        {loading ? 'Cargando...' : <>Ir al Portal Seguro <ExternalLink size={18} /></>}
                    </button>
                </div>
            )}
        </div>
    );
}