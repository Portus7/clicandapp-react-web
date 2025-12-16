import React from 'react';
import { X, Check, Zap, Shield, Star } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

// ¡IMPORTANTE! Reemplaza estos IDs con los que creaste en tu Dashboard de Stripe
const PLANS = [
    {
        id: 'prod_TcDWfmQTQK9VSr', // ID DE STRIPE PARA PLAN REGULAR (1 Sub / 5 Slots)
        name: 'Regular',
        price: '$20',
        period: '/mes',
        features: ['1 Subagencia', '5 Números de WhatsApp', 'Soporte Básico'],
        color: 'bg-blue-500',
        recommended: false
    },
    {
        id: 'price_1Sez557Mhd9qo6A8oUCnFP1c', // ID DE STRIPE PARA TIER 1 (5 Sub / 25 Slots)
        name: 'Agencia Pro',
        price: '$100', // Ejemplo
        period: '/mes',
        features: ['5 Subagencias', '25 Números de WhatsApp', 'Soporte Prioritario', 'Marca Blanca'],
        color: 'bg-indigo-600',
        recommended: true
    },
    {
        id: 'prod_TcDWfmQTQK9VSr', // ID DE STRIPE PARA TIER 2
        name: 'Enterprise',
        price: '$250', // Ejemplo
        period: '/mes',
        features: ['10 Subagencias', '50 Números de WhatsApp', 'API Dedicada', 'Onboarding Personalizado'],
        color: 'bg-purple-600',
        recommended: false
    }
];

export default function SubscriptionModal({ onClose, token }) {

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
                window.location.href = data.url; // Redirigir a Stripe Checkout
            } else {
                alert("Error al iniciar pago: " + (data.error || "Desconocido"));
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Zap className="text-yellow-500" fill="currentColor" /> Mejora tu Plan
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">Selecciona el paquete que mejor se adapte a tu crecimiento.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Body - Planes */}
                <div className="p-8 overflow-y-auto bg-gray-50 dark:bg-gray-950 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div key={plan.id} className={`relative bg-white dark:bg-gray-900 rounded-2xl border ${plan.recommended ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-800'} shadow-xl flex flex-col p-6 transition-transform hover:-translate-y-1`}>

                            {plan.recommended && (
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                    RECOMENDADO
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <Check size={18} className="text-emerald-500 shrink-0" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl ${plan.color} hover:opacity-90 active:scale-95`}
                            >
                                Elegir {plan.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}