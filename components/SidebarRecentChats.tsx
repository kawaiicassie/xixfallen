/**
 * Sidebar Recent Chats Component
 *
 * Displays recent chat branches grouped by character in the main sidebar.
 * Shows a collapsible list of characters with their chat branches.
 *
 * Features:
 * - Groups chats by character
 * - Shows character avatar and name
 * - Expandable character sections
 * - Quick navigation to chat branches
 * - Syncs with Context Manager
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/i18n";
import { LocalCharacterRecordOperations, CharacterRecord } from "@/lib/data/roleplay/character-record-operation";
import { LocalCharacterDialogueOperations } from "@/lib/data/roleplay/character-dialogue-operation";
import { switchDialogueBranch } from "@/function/dialogue/truncate";
import { trackButtonClick } from "@/utils/google-analytics";
import { getBlob } from "@/lib/data/local-storage";

interface CharacterWithBranches {
  character: CharacterRecord;
  branches: {
    nodeId: string;
    title: string;
    messageCount: number;
    isCurrent: boolean;
    preview: string;
  }[];
  avatarUrl: string | null;
}

interface SidebarRecentChatsProps {
  isOpen: boolean;
}

const SidebarRecentChats: React.FC<SidebarRecentChatsProps> = ({ isOpen }) => {
  const router = useRouter();
  const { t, fontClass } = useLanguage();
  const [characterData, setCharacterData] = useState<CharacterWithBranches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(new Set());
  const [switchingBranchId, setSwitchingBranchId] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimationComplete(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimationComplete(false);
    }
  }, [isOpen]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const characters = await LocalCharacterRecordOperations.getAllCharacters();

      const dataWithBranches: CharacterWithBranches[] = [];

      for (const character of characters) {
        const branches = await LocalCharacterDialogueOperations.getRecentBranches(
          character.id,
          5,
        );

        if (branches.length > 0) {
          let avatarUrl: string | null = null;
          try {
            if (character.imagePath) {
              const blob = await getBlob(character.imagePath);
              if (blob) {
                avatarUrl = URL.createObjectURL(blob);
              }
            }
          } catch {
            avatarUrl = null;
          }

          dataWithBranches.push({
            character,
            branches,
            avatarUrl,
          });
        }
      }

      // Sort by most recent activity (character with most messages first)
      dataWithBranches.sort((a, b) => {
        const aMaxMessages = Math.max(...a.branches.map(br => br.messageCount));
        const bMaxMessages = Math.max(...b.branches.map(br => br.messageCount));
        return bMaxMessages - aMaxMessages;
      });

      setCharacterData(dataWithBranches.slice(0, 5)); // Limit to 5 characters
    } catch (error) {
      console.error("Error fetching character data:", error);
      setCharacterData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const toggleCharacter = (characterId: string) => {
    setExpandedCharacters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  const handleBranchClick = async (characterId: string, nodeId: string) => {
    if (switchingBranchId) return;

    try {
      setSwitchingBranchId(nodeId);
      trackButtonClick("SidebarRecentChats", "Switch Branch");

      const response = await switchDialogueBranch({ characterId, nodeId });

      if (response.success) {
        // Navigate to character page
        router.push(`/character?id=${characterId}`);
      }
    } catch (error) {
      console.error("Error switching branch:", error);
    } finally {
      setSwitchingBranchId(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mt-2 mb-1">
      {/* Section Header */}
      <div
        className="flex items-center justify-between px-4 py-1 cursor-pointer hover:bg-[#252525] rounded-md mx-2 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-pink-400"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className={`text-xs text-[#8a8a8a] uppercase tracking-wider ${fontClass}`}>
            {t("recentChats.title")}
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[#6b6b6b] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-2 py-1 max-h-[380px] overflow-y-auto fantasy-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 border-t-pink-400 border-r-pink-300 border-b-pink-200 border-l-transparent animate-spin" />
            </div>
          ) : characterData.length === 0 ? (
            <div className={`text-center py-4 text-[#6b6b6b] text-xs ${fontClass}`}>
              {t("recentChats.noChats")}
            </div>
          ) : (
            <div className="space-y-1">
              {characterData.map((item) => (
                <div key={item.character.id} className="rounded-md overflow-hidden">
                  {/* Character Header */}
                  <div
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-[#252525] transition-colors duration-200 rounded-md"
                    onClick={() => toggleCharacter(item.character.id)}
                  >
                    {/* Avatar */}
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-[#333333]">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.character.data.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-[10px] text-pink-400">
                          {item.character.data.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <span className={`text-sm text-[#d4d4d4] truncate flex-1 ${fontClass}`}>
                      {item.character.data.name}
                    </span>

                    {/* Branch count & expand icon */}
                    <span className="text-[10px] text-[#6b6b6b] px-1.5 py-0.5 bg-[#2a2a2a] rounded">
                      {item.branches.length}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-[#6b6b6b] transition-transform duration-200 ${expandedCharacters.has(item.character.id) ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>

                  {/* Branches */}
                  <div
                    className={`transition-all duration-200 overflow-hidden ${expandedCharacters.has(item.character.id) ? "max-h-[200px]" : "max-h-0"}`}
                  >
                    <div className="pl-4 pr-2 pb-1 space-y-0.5">
                      {item.branches.map((branch) => (
                        <div
                          key={branch.nodeId}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors duration-200 ${branch.isCurrent ? "bg-pink-500/10 border-l-2 border-pink-400" : "hover:bg-[#252525] border-l-2 border-transparent"}`}
                          onClick={() => handleBranchClick(item.character.id, branch.nodeId)}
                        >
                          {switchingBranchId === branch.nodeId ? (
                            <div className="w-3 h-3 rounded-full border-2 border-t-pink-400 border-r-transparent border-b-transparent border-l-transparent animate-spin flex-shrink-0" />
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${branch.isCurrent ? "bg-pink-400" : "bg-[#4a4a4a]"}`} />
                          )}
                          <span className={`text-xs truncate flex-1 ${branch.isCurrent ? "text-pink-300" : "text-[#a0a0a0]"} ${fontClass}`}>
                            {branch.title || t("recentChats.untitled")}
                          </span>
                          <span className={`text-[10px] ${branch.isCurrent ? "text-pink-400/60" : "text-[#5a5a5a]"}`}>
                            {branch.messageCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarRecentChats;
