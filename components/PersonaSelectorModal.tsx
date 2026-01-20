"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/app/i18n";
import { Persona } from "@/lib/models/persona-model";
import {
  getAllPersonas,
  getDefaultPersona,
  getPersonaForCharacter,
  setPersonaForCharacter,
} from "@/lib/data/roleplay/persona-operation";

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  onPersonaChange?: (persona: Persona | null) => void;
}

export default function PersonaSelectorModal({
  isOpen,
  onClose,
  characterId,
  onPersonaChange,
}: PersonaSelectorModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    null,
  );
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [useDefault, setUseDefault] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, characterId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allPersonas = await getAllPersonas();
      setPersonas(allPersonas);

      // Get current persona for this character
      const current = await getPersonaForCharacter(characterId);
      setCurrentPersona(current);

      // Check if character has specific persona assigned
      const defaultPersona = await getDefaultPersona();

      // If current persona is the default and no specific mapping exists, useDefault = true
      if (current && defaultPersona && current.id === defaultPersona.id) {
        // Need to check if there's a specific mapping for this character
        const specificPersona = await getPersonaForCharacter(characterId);
        // If the specific persona equals default, check localStorage mapping
        const settings = localStorage.getItem("persona_settings");
        if (settings) {
          const parsed = JSON.parse(settings);
          if (
            parsed.characterPersonaMap &&
            parsed.characterPersonaMap[characterId]
          ) {
            setUseDefault(false);
            setSelectedPersonaId(parsed.characterPersonaMap[characterId]);
          } else {
            setUseDefault(true);
            setSelectedPersonaId(defaultPersona?.id || null);
          }
        } else {
          setUseDefault(true);
          setSelectedPersonaId(defaultPersona?.id || null);
        }
      } else if (current) {
        setUseDefault(false);
        setSelectedPersonaId(current.id);
      } else if (defaultPersona) {
        setUseDefault(true);
        setSelectedPersonaId(defaultPersona.id);
      }
    } catch (error) {
      console.error("Failed to load personas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (useDefault) {
        // Remove character-specific mapping, use default
        await setPersonaForCharacter(characterId, null);
        const defaultPersona = await getDefaultPersona();
        onPersonaChange?.(defaultPersona);
      } else if (selectedPersonaId) {
        // Set specific persona for this character
        await setPersonaForCharacter(characterId, selectedPersonaId);
        const selectedPersona = personas.find(
          (p) => p.id === selectedPersonaId,
        );
        onPersonaChange?.(selectedPersona || null);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save persona:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseDefaultToggle = async () => {
    if (!useDefault) {
      // Switching to use default
      setUseDefault(true);
      const defaultPersona = await getDefaultPersona();
      setSelectedPersonaId(defaultPersona?.id || null);
    } else {
      // Switching to specific persona
      setUseDefault(false);
    }
  };

  const getDefaultPersonaInfo = () => {
    const defaultPersona = personas.find((p) => p.isDefault);
    return defaultPersona;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-sm bg-black/40"
            onClick={onClose}
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fantasy-bg bg-opacity-75 border border-[#534741] rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md relative z-10 backdrop-filter backdrop-blur-sm mx-4"
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[#a18d6f] hover:text-[#f9c86d] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                className="sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <h1
                className={`text-xl sm:text-2xl font-bold text-[#f9c86d] mb-2 ${serifFontClass}`}
              >
                {t("personaSelector.title")}
              </h1>
              <p className={`text-sm text-[#a18d6f] ${fontClass}`}>
                {t("personaSelector.description")}
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-[#c0a480] border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Use Default Toggle */}
                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    useDefault
                      ? "bg-amber-500/20 border-amber-500/40"
                      : "bg-[#2a261f]/50 border-[#534741]/50 hover:border-[#534741]"
                  }`}
                  onClick={handleUseDefaultToggle}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        useDefault
                          ? "border-amber-400 bg-amber-400"
                          : "border-[#534741]"
                      }`}
                    >
                      {useDefault && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${useDefault ? "text-amber-300" : "text-[#c0a480]"} ${fontClass}`}
                      >
                        {t("personaSelector.useDefault")}
                      </div>
                      {getDefaultPersonaInfo() && (
                        <div className="text-xs text-[#8a8a8a] mt-1">
                          {t("personaSelector.currentDefault")}:{" "}
                          {getDefaultPersonaInfo()?.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Persona List */}
                {!useDefault && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <div
                      className={`text-xs text-[#a18d6f] mb-2 ${fontClass}`}
                    >
                      {t("personaSelector.selectSpecific")}
                    </div>
                    {personas.map((persona) => (
                      <div
                        key={persona.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedPersonaId === persona.id
                            ? "bg-purple-500/20 border-purple-500/40"
                            : "bg-[#2a261f]/50 border-[#534741]/50 hover:border-[#534741]"
                        }`}
                        onClick={() => setSelectedPersonaId(persona.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                            {persona.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium text-[#eae6db] truncate ${fontClass}`}
                              >
                                {persona.name}
                              </span>
                              {persona.isDefault && (
                                <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                  {t("persona.default")}
                                </span>
                              )}
                            </div>
                            {persona.description && (
                              <div className="text-xs text-[#8a8a8a] truncate mt-0.5">
                                {persona.description}
                              </div>
                            )}
                          </div>
                          {selectedPersonaId === persona.id && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="2"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current Persona Info */}
                {currentPersona && (
                  <div className="p-3 rounded-lg bg-[#2a261f]/30 border border-[#534741]/30">
                    <div
                      className={`text-xs text-[#a18d6f] mb-1 ${fontClass}`}
                    >
                      {t("personaSelector.currentPersona")}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                        {currentPersona.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`text-sm text-[#eae6db] ${fontClass}`}
                      >
                        {currentPersona.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!useDefault && !selectedPersonaId)}
                  className={`w-full group relative px-6 py-3 bg-transparent border border-[#c0a480] text-[#c0a480] rounded-lg text-sm font-medium transition-all duration-500 hover:border-[#f9c86d] hover:text-[#f9c86d] hover:shadow-lg hover:shadow-[#c0a480]/20 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${serifFontClass}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#c0a480]/0 via-[#c0a480]/10 to-[#c0a480]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {isSaving ? (
                      <>
                        <div className="animate-spin w-4 h-4 border border-[#c0a480] border-t-transparent rounded-full"></div>
                        <span>{t("common.saving")}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("common.save")}</span>
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </>
                    )}
                  </div>
                </button>

                {/* Helper Text */}
                <div
                  className={`text-center text-xs text-[#8a8a8a] ${fontClass}`}
                >
                  <p>{t("personaSelector.helperText")}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
