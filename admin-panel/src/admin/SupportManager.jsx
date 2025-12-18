import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, QrCode, Power } from 'lucide-react';
import QRCode from "react-qr-code";

// API URL (reutiliza la lógica de entorno)
const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

export default function SupportManager({ token }) {
    const [status, setStatus] = useState({ connected: false, myNumber: null });
    const [qr, setQr] = useState(null);
    const [loading, setLoading] = useState(false);
    const [polling, setPolling] = useState(false);

    const authFetch = async (endpoint, options = {}) => {
        return fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    };

    // Consultar estado
    const checkStatus = async () => {
        try {
            const res = await authFetch('/admin/support/status');
            const data = await res.json();
            setStatus({ connected: data.connected, myNumber: data.myNumber });

            if (data.connected) {
                setQr(null);
                setPolling(false);
            }
        } catch (e) { console.error("Error checking support status:", e); }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Poll lento siempre
        return () => clearInterval(interval);
    }, []);

    // Polling rápido cuando se pide QR
    useEffect(() => {
        let interval;
        if (polling) {
            interval = setInterval(async () => {
                const res = await authFetch('/admin/support/qr');
                if (res.ok) {
                    const data = await res.json();
                    if (data.qr) setQr(data.qr);
                }
                checkStatus();
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [polling]);

    const handleConnect = async () => {
        setLoading(true);
        setQr(null);
        try {
            await authFetch('/admin/support/start', { method: 'POST' });
            setPolling(true);
        } catch (e) { alert("Error iniciando conexión"); }
        setLoading(false);
    };

    const handleDisconnect = async () => {
        if (!confirm("¿Desconectar el número de soporte? Dejarás de recibir alertas.")) return;
        setLoading(true);
        try {
            await authFetch('/admin/support/disconnect', { method: 'DELETE' });
            setStatus({ connected: false, myNumber: null });
            setPolling(false);
            setQr(null);
        } catch (e) { alert("Error desconectando"); }
        setLoading(false);
    };

    return (
        <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Info */}
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${status.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {status.connected ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Bot de Alertas y Soporte</h3>
                        <p className="text-sm text-gray-500">
                            {status.connected
                                ? `Conectado: +${status.myNumber}`
                                : "Desconectado. No se enviarán alertas de desconexión."}
                        </p>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-4">
                    {/* Si está desconectado y NO hay QR visible */}
                    {!status.connected && !qr && (
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <QrCode size={18} />}
                            Vincular Bot
                        </button>
                    )}

                    {/* Si está conectado */}
                    {status.connected && (
                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50"
                        >
                            <Power size={18} />
                            Desconectar
                        </button>
                    )}
                </div>
            </div>

            {/* Panel de QR Desplegable */}
            {!status.connected && (qr || polling) && (
                <div className="mt-6 border-t border-gray-100 pt-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
                    <p className="text-sm text-gray-500 mb-4 font-medium">Escanea este código con el WhatsApp que enviará las alertas:</p>
                    <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                        {qr ? (
                            <QRCode value={qr} size={200} />
                        ) : (
                            <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400">
                                <RefreshCw className="animate-spin mb-2" />
                                <span className="text-xs">Generando QR...</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => { setPolling(false); setQr(null); }}
                        className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
}