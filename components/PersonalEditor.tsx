"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/app/i18n";
import { Personal } from "@/lib/models/personal-model";
import {
  getAllPersonals,
  savePersonal,
  deletePersonal,
  setDefaultPersonal,
  createNewPersonal,
} from "@/lib/data/roleplay/personal-operation";

interface PersonalEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonalChange?: () => void;
}

export default function PersonalEditor({
  isOpen,
  onClose,
  onPersonalChange,
}: PersonalEditorProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [personals, setPersonals] = useState<Personal[]>([]);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPersonalName, setNewPersonalName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    personality: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadPersonals();
    }
  }, [isOpen]);

  const loadPersonals = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPersonals();
      setPersonals(data);
      if (data.length > 0 && !selectedPersonal) {
        const defaultPersonal = data.find((p) => p.isDefault) || data[0];
        setSelectedPersonal(defaultPersonal);
      }
    } catch (error) {
      console.error("Failed to load personals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersonal = (personal: Personal) => {
    setSelectedPersonal(personal);
    setIsEditing(false);
    setEditForm({
      name: personal.name,
      description: personal.description,
      personality: personal.personality,
    });
  };

  const handleStartEdit = () => {
    if (selectedPersonal) {
      setEditForm({
        name: selectedPersonal.name,
        description: selectedPersonal.description,
        personality: selectedPersonal.personality,
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPersonal || !editForm.name.trim()) return;

    setIsLoading(true);
    try {
      const updated: Personal = {
        ...selectedPersonal,
        name: editForm.name.trim(),
        description: editForm.description,
        personality: editForm.personality,
      };
      await savePersonal(updated);
      await loadPersonals();
      setSelectedPersonal(updated);
      setIsEditing(false);
      onPersonalChange?.();
    } catch (error) {
      console.error("Failed to save personal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newPersonalName.trim()) return;

    setIsLoading(true);
    try {
      const newPersonal = await createNewPersonal(newPersonalName.trim());
      await loadPersonals();
      setSelectedPersonal(newPersonal);
      setNewPersonalName("");
      setIsCreating(false);
      onPersonalChange?.();
    } catch (error) {
      console.error("Failed to create personal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPersonal || personals.length <= 1) return;

    if (
      !confirm(
        t("personal.confirmDelete").replace("{name}", selectedPersonal.name),
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await deletePersonal(selectedPersonal.id);
      await loadPersonals();
      setSelectedPersonal(null);
      onPersonalChange?.();
    } catch (error) {
      console.error("Failed to delete personal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedPersonal) return;

    setIsLoading(true);
    try {
      await setDefaultPersonal(selectedPersonal.id);
      await loadPersonals();
      onPersonalChange?.();
    } catch (error) {
      console.error("Failed to set default personal:", error);
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
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 opacity-60" />

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
              {t("personal.title")}
            </h2>
            <p className={`text-sm text-[#888] mt-1 ${fontClass}`}>
              {t("personal.subtitle")}
            </p>
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-hidden flex">
            {/* Personal List */}
            <div className="w-1/3 border-r border-[#3a3a3a]/50 overflow-y-auto p-4">
              <div className="space-y-2">
                {personals.map((personal) => (
                  <button
                    key={personal.id}
                    onClick={() => handleSelectPersonal(personal)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedPersonal?.id === personal.id
                        ? "bg-amber-500/20 border border-amber-500/40"
                        : "bg-[#2a2a2a]/50 border border-transparent hover:bg-[#2a2a2a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                        {personal.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium text-[#f4e8c1] truncate ${fontClass}`}
                        >
                          {personal.name}
                        </div>
                        {personal.isDefault && (
                          <div className="text-xs text-amber-400">
                            {t("personal.default")}
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
                      value={newPersonalName}
                      onChange={(e) => setNewPersonalName(e.target.value)}
                      placeholder={t("personal.namePlaceholder")}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-1 text-sm text-[#f4e8c1] focus:outline-none focus:border-amber-500/50"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleCreateNew}
                        disabled={!newPersonalName.trim() || isLoading}
                        className="flex-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        {t("personal.create")}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setNewPersonalName("");
                        }}
                        className="px-2 py-1 bg-[#3a3a3a] text-[#888] text-xs rounded hover:bg-[#4a4a4a]"
                      >
                        {t("personal.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full p-3 rounded-lg border border-dashed border-[#3a3a3a] text-[#888] hover:text-amber-400 hover:border-amber-500/40 transition-all duration-200 flex items-center justify-center gap-2"
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
                      {t("personal.addNew")}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Personal Details */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedPersonal ? (
                <div className="space-y-4">
                  {/* Actions */}
                  <div className="flex gap-2 mb-4">
                    {!isEditing && (
                      <>
                        <button
                          onClick={handleStartEdit}
                          className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg hover:bg-amber-500/30 transition-colors"
                        >
                          {t("personal.edit")}
                        </button>
                        {!selectedPersonal.isDefault && (
                          <button
                            onClick={handleSetDefault}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                          >
                            {t("personal.setDefault")}
                          </button>
                        )}
                        {personals.length > 1 && (
                          <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {t("personal.delete")}
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
                        {t("personal.name")}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-[#f4e8c1] text-sm focus:outline-none focus:border-amber-500/50"
                        />
                      ) : (
                        <div className={`text-[#f4e8c1] ${fontClass}`}>
                          {selectedPersonal.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-medium text-[#a18d6f] mb-2 ${fontClass}`}
                      >
                        {t("personal.description")}
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
                          rows={3}
                          placeholder={t("personal.descriptionPlaceholder")}
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-[#f4e8c1] text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                        />
                      ) : (
                        <div
                          className={`text-[#ccc] text-sm ${fontClass} ${!selectedPersonal.description && "text-[#666] italic"}`}
                        >
                          {selectedPersonal.description ||
                            t("personal.noDescription")}
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-medium text-[#a18d6f] mb-2 ${fontClass}`}
                      >
                        {t("personal.personality")}
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editForm.personality}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              personality: e.target.value,
                            })
                          }
                          rows={4}
                          placeholder={t("personal.personalityPlaceholder")}
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-[#f4e8c1] text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                        />
                      ) : (
                        <div
                          className={`text-[#ccc] text-sm ${fontClass} ${!selectedPersonal.personality && "text-[#666] italic"}`}
                        >
                          {selectedPersonal.personality ||
                            t("personal.noPersonality")}
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editForm.name.trim() || isLoading}
                          className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          {t("personal.save")}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-[#3a3a3a] text-[#ccc] text-sm rounded-lg hover:bg-[#4a4a4a] transition-colors"
                        >
                          {t("personal.cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#666]">
                  <p className={fontClass}>{t("personal.selectOrCreate")}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
