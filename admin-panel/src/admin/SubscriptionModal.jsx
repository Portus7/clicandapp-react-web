import React, { useState, useRef } from 'react';
import {
    X, Check, Zap, Building2, Smartphone, ArrowRight,
    CreditCard, FileText, Layers, Plus, Trash2, ExternalLink
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// --- DATOS DE EJEMPLO Y CONFIGURACIÓN ---
// En un futuro, esto podría venir de una API que lea tus productos de Stripe
const AVAILABLE_ADDONS = [
    {
        id: 'addon_subaccount',
        name: 'Subcuenta Adicional',
        price: '$15',
        period: '/mes',
        desc: 'Ideal para expandir tu equipo de trabajo.',
        features: ['Acceso CRM completo', 'Gestión independiente', 'Sin compartir datos'],
        stripePriceId: 'price_SUB_UNIT_ID' // ⚠️ REEMPLAZAR
    },
    {
        id: 'addon_whatsapp',
        name: 'WhatsApp Adicional',
        price: '$6',
        period: '/mes',
        desc: 'Añade más números para atención al cliente.',
        features: ['Línea dedicada', 'Multi-dispositivo', 'Reconexión automática'],
        stripePriceId: 'price_SLOT_UNIT_ID' // ⚠️ REEMPLAZAR
    }
];

export default function SubscriptionModal({ onClose, token, accountInfo }) {
    const [activeTab, setActiveTab] = useState('my_subscriptions'); // 'my_subscriptions', 'payment_methods', 'new_subscription', 'invoices'
    const [loading, setLoading] = useState(false);

    // --- ACCIONES ---
    const handlePortal = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/payments/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert("Error al abrir portal");
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (priceId) => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    // --- CÁLCULO DE RECURSOS ACTIVOS ---
    // Simulamos que cada unidad de límite es una "suscripción" para visualizarlo como en tu ejemplo
    const activeSubscriptions = [
        {
            id: 'plan_base',
            name: accountInfo?.plan === 'active' ? 'Plan Agencia Pro (Base)' : 'Plan Trial',
            quantity: 1,
            price: accountInfo?.plan === 'active' ? '$100.00/mes' : '$0.00/mes',
            status: accountInfo?.plan === 'active' ? 'Active' : 'Trial',
            nextRenewal: 'Automática por Stripe',
            isBase: true
        }
    ];

    if (accountInfo?.limits?.max_subagencies > 1) {
        activeSubscriptions.push({
            id: 'extra_subs',
            name: 'Paquete de Subcuentas',
            quantity: accountInfo.limits.max_subagencies,
            price: 'Incluido en Plan',
            status: 'Active',
            nextRenewal: '-'
        });
    }

    if (accountInfo?.limits?.max_slots > 5) {
        activeSubscriptions.push({
            id: 'extra_slots',
            name: 'Paquete de WhatsApps',
            quantity: accountInfo.limits.max_slots,
            price: 'Incluido en Plan',
            status: 'Active',
            nextRenewal: '-'
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-gray-200 dark:border-gray-800">

                {/* HEADER CON PESTAÑAS */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-center px-8 py-5">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Suscripción</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* TABS NAVIGATION */}
                    <div className="flex px-8 gap-8 overflow-x-auto no-scrollbar">
                        <TabButton
                            id="my_subscriptions"
                            label="Mis Suscripciones"
                            active={activeTab}
                            onClick={setActiveTab}
                        />
                        <TabButton
                            id="payment_methods"
                            label="Métodos de Pago"
                            active={activeTab}
                            onClick={setActiveTab}
                        />
                        <TabButton
                            id="new_subscription"
                            label="Nueva Suscripción"
                            active={activeTab}
                            onClick={setActiveTab}
                            highlight
                        />
                        <TabButton
                            id="invoices"
                            label="Facturas"
                            active={activeTab}
                            onClick={setActiveTab}
                        />
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-[#0B0D12]">

                    {/* TAB 1: MIS SUSCRIPCIONES */}
                    {activeTab === 'my_subscriptions' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Suscripciones Activas</h3>
                                <p className="text-sm text-gray-500">Gestiona tus planes y recursos contratados.</p>
                            </div>

                            {activeSubscriptions.map((sub, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white">{sub.name}</h4>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${sub.status === 'Active'
                                                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                                                    : 'bg-amber-50 text-amber-600 border-amber-200'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Cantidad</p>
                                                <p className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded w-fit">{sub.quantity}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Precio</p>
                                                <p className="font-medium text-gray-700 dark:text-gray-300">{sub.price}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Renovación</p>
                                                <p className="font-medium text-gray-700 dark:text-gray-300">{sub.nextRenewal}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón Cancelar (Redirige al portal para seguridad) */}
                                    <button
                                        onClick={handlePortal}
                                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors self-start md:self-center"
                                    >
                                        <Trash2 size={16} /> Cancelar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 2: MÉTODOS DE PAGO */}
                    {activeTab === 'payment_methods' && (
                        <div className="max-w-3xl mx-auto text-center py-12">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CreditCard size={40} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Seguridad de Pagos</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                Para garantizar la máxima seguridad, gestionamos tus tarjetas directamente a través del portal encriptado de Stripe.
                            </p>
                            <button
                                onClick={handlePortal}
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 mx-auto"
                            >
                                {loading ? <RefreshCw className="animate-spin" /> : <ExternalLink size={18} />}
                                Gestionar Tarjetas en Stripe
                            </button>
                        </div>
                    )}

                    {/* TAB 3: NUEVA SUSCRIPCIÓN (Add-ons) */}
                    {activeTab === 'new_subscription' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add-ons Disponibles</h3>
                                <p className="text-sm text-gray-500">Potencia tu agencia con recursos adicionales.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {AVAILABLE_ADDONS.map((addon) => (
                                    <div key={addon.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{addon.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{addon.desc}</p>

                                            <div className="flex flex-wrap gap-4">
                                                {addon.features.map((feat, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                        <Check size={14} className="text-indigo-500" /> {feat}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="text-center md:text-right flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                                            <div>
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{addon.price}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{addon.period}</span>
                                            </div>
                                            <button
                                                onClick={() => handleSubscribe(addon.stripePriceId)}
                                                className="w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition shadow-md"
                                            >
                                                Suscribirse
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: FACTURAS */}
                    {activeTab === 'invoices' && (
                        <div className="max-w-3xl mx-auto text-center py-12">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText size={40} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Historial de Facturación</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                Accede y descarga todas tus facturas pasadas y pendientes desde el portal fiscal.
                            </p>
                            <button
                                onClick={handlePortal}
                                className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 mx-auto"
                            >
                                <ExternalLink size={18} />
                                Ver Facturas
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Subcomponente de Pestaña
const TabButton = ({ id, label, active, onClick, highlight }) => (
    <button
        onClick={() => onClick(id)}
        className={`relative pb-4 px-1 text-sm font-bold transition-colors whitespace-nowrap
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
            <span className="absolute top-0 -right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
        )}
    </button>
);