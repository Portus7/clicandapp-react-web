import React, { useState } from 'react';
import { Mail, Lock, Building2, ArrowRight, UserCheck, Loader2 } from 'lucide-react';

// URL del Backend
const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

export default function WelcomeAuth({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true); // Toggle entre Login y Registro
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados del formulario
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agencyName, setAgencyName] = useState(""); // Solo para registro

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Determinamos el endpoint según el modo
        const endpoint = isLogin ? "/auth/login" : "/auth/register";

        // Preparamos el payload
        // Si es registro, forzamos el rol 'agency' por defecto
        const payload = isLogin
            ? { email, password }
            : { email, password, role: 'agency', agencyName };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error en la solicitud");

            if (isLogin) {
                // LOGIN EXITOSO: Pasamos los datos a App.jsx
                onLoginSuccess(data);
            } else {
                // REGISTRO EXITOSO
                alert("Cuenta creada con éxito. Por favor inicia sesión.");
                setIsLogin(true); // Cambiamos a la vista de login
                setPassword(""); // Limpiamos password por seguridad
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            {/* --- SECCIÓN IZQUIERDA (Visual / Marketing) --- */}
            {/* Oculta en móviles, visible en desktop (lg) */}
            <div className="hidden lg:flex w-1/2 bg-indigo-600 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90"></div>

                <div className="relative z-10 text-white p-12 max-w-lg">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                        <Building2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
                        Gestiona tus <br /> Automatizaciones
                    </h1>
                    <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                        Controla múltiples subcuentas de WhatsApp, gestiona IA y conecta con GoHighLevel desde un solo lugar seguro y escalable.
                    </p>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                            <UserCheck size={18} />
                            <span className="text-sm font-medium">Multi-Agencia</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                            <Lock size={18} />
                            <span className="text-sm font-medium">Seguridad JWT</span>
                        </div>
                    </div>
                </div>

                {/* Elementos decorativos de fondo */}
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
                <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl mix-blend-overlay"></div>
            </div>

            {/* --- SECCIÓN DERECHA (Formulario) --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 animate-in slide-in-from-right-10 duration-500 fade-in">
                <div className="max-w-md w-full bg-white lg:bg-transparent p-8 lg:p-0 rounded-2xl shadow-xl lg:shadow-none">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {isLogin ? "Ingresa tus credenciales para acceder al panel." : "Empieza a gestionar tus agencias hoy mismo."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r shadow-sm flex items-center animate-pulse">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Campo Nombre de Agencia (Solo Registro) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Agencia</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 size={18} className="text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-all outline-none"
                                        placeholder="Mi Agencia Digital"
                                        value={agencyName}
                                        onChange={e => setAgencyName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-all outline-none"
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-all outline-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" /> Procesando...
                                </>
                            ) : (
                                <>
                                    {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            {isLogin ? "¿No tienes cuenta aún?" : "¿Ya tienes una cuenta?"}{" "}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-2 decoration-transparent hover:decoration-indigo-200"
                            >
                                {isLogin ? "Regístrate gratis" : "Inicia sesión"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}