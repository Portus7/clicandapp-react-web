import React, { useState, useEffect } from 'react';
import {
    X, Smartphone, Plus, Trash2, Settings, Tag,
    RefreshCw, Edit2, Loader2, User, Hash, Link2, MessageSquare
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || "https://wa.clicandapp.com").replace(/\/$/, "");

export default function LocationDetailsModal({ location, onClose, token, onLogout }) {
    const [slots, setSlots] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [ghlUsers, setGhlUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Control de expansión y pestañas internas
    const [expandedSlotId, setExpandedSlotId] = useState(null);
    const [activeSlotTab, setActiveSlotTab] = useState('general'); // 'general' | 'ghl' | 'keywords'

    const [deletingSlotId, setDeletingSlotId] = useState(null);

    const authFetch = async (endpoint, options = {}) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.status === 401 || res.status === 403) {
            onLogout(); onClose(); return null;
        }
        return res;
    };

    useEffect(() => {
        loadData();
    }, [location]);

    const loadData = async () => {
        setLoading(true);
        try {
            const detailsRes = await authFetch(`/agency/location-details/${location.location_id}`);
            const detailsData = await detailsRes.json();

            if (detailsData) {
                setSlots(detailsData.slots || []);
                setKeywords(detailsData.keywords || []);
            }

            const usersRes = await authFetch(`/agency/ghl-users/${location.location_id}`);
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setGhlUsers(usersData || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIONES DE SLOT ---
    const handleAddSlot = async () => {
        const res = await authFetch(`/agency/add-slot`, {
            method: "POST",
            body: JSON.stringify({ locationId: location.location_id })
        });
        if (res && res.ok) loadData();
    };

    const handleDeleteSlot = async (slotId) => {
        if (!confirm("¿Eliminar dispositivo? Se cerrará la sesión de WhatsApp.")) return;
        setDeletingSlotId(slotId);
        await authFetch(`/agency/slots/${location.location_id}/${slotId}`, { method: "DELETE" });
        setDeletingSlotId(null);
        loadData();
    };

    const editSlotName = async (slotId, currentName) => {
        const newName = prompt("Nuevo nombre:", currentName || "");
        if (newName && newName !== currentName) {
            const res = await authFetch(`/config-slot`, {
                method: "POST",
                body: JSON.stringify({ locationId: location.location_id, slot: slotId, slotName: newName })
            });
            if (res && res.ok) {
                setSlots(prev => prev.map(s => s.slot_id === slotId ? { ...s, slot_name: newName } : s));
            }
        }
    };

    // Manejar apertura de slot
    const handleExpandSlot = (slotId) => {
        if (expandedSlotId === slotId) {
            setExpandedSlotId(null);
        } else {
            setExpandedSlotId(slotId);
            setActiveSlotTab('general'); // Reiniciar a la pestaña 1
        }
    };

    // --- CONFIGURACIÓN ---
    const getSafeSettings = (currentSettings) => ({
        show_source_label: true,
        transcribe_audio: true,
        create_unknown_contacts: true,
        send_disconnect_message: true,
        ghl_contact_tag: "",
        ghl_assigned_user: ""
    });

    const toggleSlotSetting = async (slotId, key, currentSettings) => {
        const safeSettings = { ...getSafeSettings(currentSettings), ...currentSettings };
        const newSettings = { ...safeSettings, [key]: !safeSettings[key] };
        updateSettingsBackend(slotId, newSettings);
    };

    const changeSlotSetting = async (slotId, key, value, currentSettings) => {
        const safeSettings = { ...getSafeSettings(currentSettings), ...currentSettings };
        const newSettings = { ...safeSettings, [key]: value };
        updateSettingsBackend(slotId, newSettings);
    };

    const updateSettingsBackend = async (slotId, newSettings) => {
        setSlots(prev => prev.map(s => s.slot_id === slotId ? { ...s, settings: newSettings } : s));
        await authFetch(`/agency/slots/${location.location_id}/${slotId}/settings`, {
            method: 'PUT',
            body: JSON.stringify({ settings: newSettings })
        });
    };

    // --- KEYWORDS ---
    const handleAddKeyword = async (e, slotId) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const keyword = formData.get('keyword');
        const tag = formData.get('tag');

        const res = await authFetch(`/agency/keywords`, {
            method: 'POST',
            body: JSON.stringify({ locationId: location.location_id, slotId, keyword, tag })
        });
        if (res && res.ok) loadData();
    };

    const deleteKeyword = async (id) => {
        await authFetch(`/agency/keywords/${id}`, { method: 'DELETE' });
        loadData();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-300 dark:border-gray-700">

                {/* HEADER MODAL */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Smartphone className="text-indigo-600 dark:text-indigo-400" size={24} />
                            {location.name || location.location_id}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión individual de dispositivos</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500 dark:text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                    <div className="flex justify-end mb-6">
                        <button onClick={handleAddSlot} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition">
                            <Plus size={18} /> Agregar Nuevo Número
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-10"><RefreshCw className="animate-spin text-indigo-600" /></div>
                    ) : slots.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No hay números configurados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {slots.map(slot => {
                                const isExpanded = expandedSlotId === slot.slot_id;
                                const isConnected = !!slot.phone_number;
                                const slotKeywords = keywords.filter(k => k.slot_id === slot.slot_id);
                                const currentSettings = slot.settings || {};

                                return (
                                    <div key={slot.slot_id} className={`bg-white dark:bg-gray-900 border rounded-xl transition-all duration-300 ${isExpanded
                                            ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg'
                                            : 'border-gray-300 dark:border-gray-700 shadow-sm hover:border-indigo-300'
                                        }`}>

                                        {/* CABECERA SLOT */}
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-xl transition-colors"
                                            onClick={() => handleExpandSlot(slot.slot_id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-gray-400'}`}></div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{slot.slot_name || `Slot ${slot.slot_id}`}</h3>
                                                        <button onClick={(e) => { e.stopPropagation(); editSlotName(slot.slot_id, slot.slot_name); }} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                                        {isConnected ? `+${slot.phone_number}` : 'Desconectado'} • ID: {slot.slot_id}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${isExpanded
                                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {isExpanded ? 'Editando' : 'Gestionar'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.slot_id); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                                    disabled={deletingSlotId === slot.slot_id}
                                                >
                                                    {deletingSlotId === slot.slot_id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* CUERPO EXPANDIBLE CON TABS */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 rounded-b-xl animate-in slide-in-from-top-2">

                                                {/* NAVEGACIÓN DE TABS */}
                                                <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4">
                                                    <button onClick={() => setActiveSlotTab('general')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeSlotTab === 'general' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                                        <Settings size={16} /> General
                                                    </button>
                                                    <button onClick={() => setActiveSlotTab('ghl')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeSlotTab === 'ghl' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                                        <Link2 size={16} /> Integración GHL
                                                    </button>
                                                    <button onClick={() => setActiveSlotTab('keywords')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeSlotTab === 'keywords' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                                        <Tag size={16} /> Keywords
                                                    </button>
                                                </div>

                                                {/* CONTENIDO DE TABS */}
                                                <div className="p-6">

                                                    {/* 1. GENERAL TAB */}
                                                    {activeSlotTab === 'general' && (
                                                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in">
                                                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Comportamiento del Bot</h4>
                                                            <div className="space-y-4">
                                                                <SettingRow
                                                                    label="Firma de Origen"
                                                                    desc="Añadir 'Source: [Nombre]' al final del mensaje."
                                                                    checked={currentSettings.show_source_label ?? true}
                                                                    onChange={() => toggleSlotSetting(slot.slot_id, 'show_source_label', slot.settings)}
                                                                />
                                                                <SettingRow
                                                                    label="Transcripción IA"
                                                                    desc="Convertir audios recibidos a texto."
                                                                    checked={currentSettings.transcribe_audio ?? true}
                                                                    onChange={() => toggleSlotSetting(slot.slot_id, 'transcribe_audio', slot.settings)}
                                                                />
                                                                <SettingRow
                                                                    label="Crear Contactos"
                                                                    desc="Registrar leads desconocidos en GHL."
                                                                    checked={currentSettings.create_unknown_contacts ?? true}
                                                                    onChange={() => toggleSlotSetting(slot.slot_id, 'create_unknown_contacts', slot.settings)}
                                                                />
                                                                <SettingRow
                                                                    label="Alerta Desconexión"
                                                                    desc="Avisar al número si se cierra la sesión."
                                                                    checked={currentSettings.send_disconnect_message ?? true}
                                                                    onChange={() => toggleSlotSetting(slot.slot_id, 'send_disconnect_message', slot.settings)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 2. GHL TAB */}
                                                    {activeSlotTab === 'ghl' && (
                                                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in">
                                                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Acciones CRM Automáticas</h4>
                                                            <div className="space-y-6">
                                                                {/* Tag */}
                                                                <div>
                                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                                        <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded text-blue-600"><Hash size={14} /></div>
                                                                        Tag Automático (Entrante)
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Ej: whatsapp-ventas"
                                                                        className="w-full text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                                        value={currentSettings.ghl_contact_tag || ""}
                                                                        onChange={(e) => changeSlotSetting(slot.slot_id, 'ghl_contact_tag', e.target.value, slot.settings)}
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-1.5 ml-1">Se aplicará este tag a cualquier contacto que escriba a este número.</p>
                                                                </div>

                                                                <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                                                                {/* Responsable */}
                                                                <div>
                                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                                        <div className="bg-purple-100 dark:bg-purple-900 p-1 rounded text-purple-600"><User size={14} /></div>
                                                                        Usuario Responsable
                                                                    </label>
                                                                    <div className="relative">
                                                                        <select
                                                                            className="w-full text-sm p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                                                            value={currentSettings.ghl_assigned_user || ""}
                                                                            onChange={(e) => changeSlotSetting(slot.slot_id, 'ghl_assigned_user', e.target.value, slot.settings)}
                                                                        >
                                                                            <option value="">-- Sin asignar (Cualquiera) --</option>
                                                                            {ghlUsers.map(u => (
                                                                                <option key={u.id} value={u.id}>
                                                                                    {u.name} ({u.role || 'User'})
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        {/* Icono Flecha */}
                                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-1.5 ml-1">Las conversaciones entrantes se asignarán automáticamente a este usuario en GHL.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 3. KEYWORDS TAB */}
                                                    {activeSlotTab === 'keywords' && (
                                                        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in">
                                                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                <MessageSquare size={14} /> Respuestas Automáticas
                                                            </h4>

                                                            <form onSubmit={(e) => handleAddKeyword(e, slot.slot_id)} className="flex gap-3 mb-6">
                                                                <div className="flex-1">
                                                                    <input name="keyword" required placeholder="Si dice..." className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                                </div>
                                                                <div className="w-1/3">
                                                                    <input name="tag" required placeholder="Tag..." className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                                </div>
                                                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-bold">
                                                                    <Plus size={20} />
                                                                </button>
                                                            </form>

                                                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                                                {slotKeywords.length === 0 ? (
                                                                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                                                        <p className="text-xs text-gray-400">No hay reglas específicas para este número.</p>
                                                                    </div>
                                                                ) : (
                                                                    slotKeywords.map(k => (
                                                                        <div key={k.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition">
                                                                            <div className="flex gap-3 items-center overflow-hidden">
                                                                                <span className="font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">"{k.keyword}"</span>
                                                                                <span className="text-gray-400">→</span>
                                                                                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 text-xs px-2 py-1 rounded font-bold border border-indigo-200 dark:border-indigo-800">{k.tag}</span>
                                                                            </div>
                                                                            <button onClick={() => deleteKeyword(k.id)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"><Trash2 size={16} /></button>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const SettingRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between group">
        <div className="pr-4">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-indigo-100 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    </div>
);