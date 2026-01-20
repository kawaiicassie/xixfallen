"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/app/i18n";
import { Persona } from "@/lib/models/persona-model";
import {
  getAllPersonas,
  savePersona,
  deletePersona,
  setDefaultPersona,
  createNewPersona,
} from "@/lib/data/roleplay/persona-operation";

interface PersonaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaChange?: () => void;
}

export default function PersonaEditor({
  isOpen,
  onClose,
  onPersonaChange,
}: PersonaEditorProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadPersonas();
    }
  }, [isOpen]);

  const loadPersonas = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPersonas();
      setPersonas(data);
      if (data.length > 0 && !selectedPersona) {
        const defaultPersona = data.find((p) => p.isDefault) || data[0];
        setSelectedPersona(defaultPersona);
      }
    } catch (error) {
      console.error("Failed to load personas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setIsEditing(false);
    setEditForm({
      name: persona.name,
      description: persona.description,
    });
  };

  const handleStartEdit = () => {
    if (selectedPersona) {
      setEditForm({
        name: selectedPersona.name,
        description: selectedPersona.description,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPersona || !editForm.name.trim()) return;

    setIsLoading(true);
    try {
      const updated: Persona = {
        ...selectedPersona,
        name: editForm.name.trim(),
        description: editForm.description,
      };
      await savePersona(updated);
      await loadPersonas();
      setSelectedPersona(updated);
      setIsEditing(false);
      onPersonaChange?.();
    } catch (error) {
      console.error("Failed to save persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newPersonaName.trim()) return;

    setIsLoading(true);
    try {
      const newPersona = await createNewPersona(newPersonaName.trim());
      await loadPersonas();
      setSelectedPersona(newPersona);
      setNewPersonaName("");
      setIsCreating(false);
      onPersonaChange?.();
    } catch (error) {
      console.error("Failed to create persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPersona || personas.length <= 1) return;

    if (
      !confirm(
        t("persona.confirmDelete").replace("{name}", selectedPersona.name),
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await deletePersona(selectedPersona.id);
      await loadPersonas();
      setSelectedPersona(null);
      onPersonaChange?.();
    } catch (error) {
      console.error("Failed to delete persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedPersona) return;

    setIsLoading(true);
    try {
      await setDefaultPersona(selectedPersona.id);
      await loadPersonas();
      onPersonaChange?.();
    } catch (error) {
      console.error("Failed to set default persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[80vh] mx-4 bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a] rounded-2xl shadow-2xl border border-[#3a3a3a]/50 overflow-hidden flex flex-col"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 opacity-60" />

          {/* Header */}
          <div className="relative p-6 pb-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#f4e8c1] transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 className={`text-xl font-bold text-[#f4e8c1] ${serifFontClass}`}>
              {t("persona.title")}
            </h2>
            <p className={`text-sm text-[#888] mt-1 ${fontClass}`}>
              {t("persona.subtitle")}
            </p>
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-hidden flex">
            {/* Persona List */}
            <div className="w-1/3 border-r border-[#3a3a3a]/50 overflow-y-auto p-4">
              <div className="space-y-2">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedPersona?.id === persona.id
                        ? "bg-pink-500/20 border border-pink-500/40"
                        : "bg-[#2a2a2a]/50 border border-transparent hover:bg-[#2a2a2a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                        {persona.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium text-[#f4e8c1] truncate ${fontClass}`}
                        >
                          {persona.name}
                        </div>
                        {persona.isDefault && (
                          <div className="text-xs text-pink-400">
                            {t("persona.default")}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Create New Button */}
                {isCreating ? (
                  <div className="p-3 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
                    <input
                      type="text"
                      value={newPersonaName}
                      onChange={(e) => setNewPersonaName(e.target.value)}
                      placeholder={t("persona.namePlaceholder")}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-1 text-sm text-[#f4e8c1] focus:outline-none focus:border-pink-500/50"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleCreateNew}
                        disabled={!newPersonaName.trim() || isLoading}
                        className="flex-1 px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded hover:bg-pink-500/30 disabled:opacity-50"
                      >
                        {t("persona.create")}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setNewPersonaName("");
                        }}
                        className="px-2 py-1 bg-[#3a3a3a] text-[#888] text-xs rounded hover:bg-[#4a4a4a]"
                      >
                        {t("persona.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full p-3 rounded-lg border border-dashed border-[#3a3a3a] text-[#888] hover:text-pink-400 hover:border-pink-500/40 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span className={`text-sm ${fontClass}`}>
                      {t("persona.addNew")}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Persona Details */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedPersona ? (
                <div className="space-y-4">
                  {/* Actions */}
                  <div className="flex gap-2 mb-4">
                    {!isEditing && (
                      <>
                        <button
                          onClick={handleStartEdit}
                          className="px-3 py-1.5 bg-pink-500/20 text-pink-400 text-xs rounded-lg hover:bg-pink-500/30 transition-colors"
                        >
                          {t("persona.edit")}
                        </button>
                        {!selectedPersona.isDefault && (
                          <button
                            onClick={handleSetDefault}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                          >
                            {t("persona.setDefault")}
                          </button>
                        )}
                        {personas.length > 1 && (
                          <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {t("persona.delete")}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-xs font-medium text-[#a18d6f] mb-2 ${fontClass}`}
                      >
                        {t("persona.name")}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-[#f4e8c1] text-sm focus:outline-none focus:border-pink-500/50"
                        />
                      ) : (
                        <div className={`text-[#f4e8c1] ${fontClass}`}>
                          {selectedPersona.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-medium text-[#a18d6f] mb-2 ${fontClass}`}
                      >
                        {t("persona.description")}
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          rows={6}
                          placeholder={t("persona.descriptionPlaceholder")}
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-[#f4e8c1] text-sm focus:outline-none focus:border-pink-500/50 resize-none"
                        />
                      ) : (
                        <div
                          className={`text-[#ccc] text-sm ${fontClass} ${!selectedPersona.description && "text-[#666] italic"}`}
                        >
                          {selectedPersona.description ||
                            t("persona.noDescription")}
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editForm.name.trim() || isLoading}
                          className="px-4 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
                        >
                          {t("persona.save")}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-[#3a3a3a] text-[#ccc] text-sm rounded-lg hover:bg-[#4a4a4a] transition-colors"
                        >
                          {t("persona.cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#666]">
                  <p className={fontClass}>{t("persona.selectOrCreate")}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
