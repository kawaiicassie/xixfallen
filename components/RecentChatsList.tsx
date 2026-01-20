/**
 * Recent Chats List Component
 *
 * Displays a list of recent chat branches for a character in the sidebar.
 * Integrates with DialogueTree to show all conversation branches and allows
 * quick navigation to different conversation points.
 *
 * Features:
 * - Shows all leaf branches (endpoints) of the dialogue tree
 * - Highlights the current active branch
 * - Allows quick switching between branches
 * - Collapsible/expandable list
 * - Syncs with Context Manager (DialogueTreeModal)
 *
 * Dependencies:
 * - LocalCharacterDialogueOperations: For fetching branch data
 * - switchDialogueBranch: For branch navigation
 * - useLanguage: For internationalization
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/app/i18n";
import { LocalCharacterDialogueOperations } from "@/lib/data/roleplay/character-dialogue-operation";
import { switchDialogueBranch } from "@/function/dialogue/truncate";
import { trackButtonClick } from "@/utils/google-analytics";

interface RecentBranch {
  nodeId: string;
  title: string;
  messageCount: number;
  isCurrent: boolean;
  preview: string;
}

interface RecentChatsListProps {
  characterId: string;
  isCollapsed: boolean;
  onBranchSwitch?: () => void;
  refreshTrigger?: number;
}

/**
 * Recent chats list component for sidebar
 *
 * @param characterId - The character's ID to fetch branches for
 * @param isCollapsed - Whether the sidebar is collapsed
 * @param onBranchSwitch - Callback when a branch is switched
 * @param refreshTrigger - Number that changes to trigger a refresh
 */
const RecentChatsList: React.FC<RecentChatsListProps> = ({
  characterId,
  isCollapsed,
  onBranchSwitch,
  refreshTrigger,
}) => {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [branches, setBranches] = useState<RecentBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [switchingBranchId, setSwitchingBranchId] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    if (!characterId) {
      setBranches([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const recentBranches = await LocalCharacterDialogueOperations.getRecentBranches(
        characterId,
        10,
      );
      setBranches(recentBranches);
    } catch (error) {
      console.error("Error fetching recent branches:", error);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches, refreshTrigger]);

  const handleBranchClick = async (nodeId: string) => {
    if (switchingBranchId || !characterId) return;

    try {
      setSwitchingBranchId(nodeId);
      trackButtonClick("RecentChatsList", "Switch Branch");

      const response = await switchDialogueBranch({ characterId, nodeId });

      if (response.success) {
        // Refresh the list to update current branch indicator
        await fetchBranches();

        // Notify parent component
        if (onBranchSwitch) {
          onBranchSwitch();
        }
      }
    } catch (error) {
      console.error("Error switching branch:", error);
    } finally {
      setSwitchingBranchId(null);
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="transition-all duration-300 ease-in-out">
      {/* Section Header */}
      <div
        className="px-2 py-1 flex justify-between items-center text-xs text-[#8a8a8a] uppercase tracking-wider font-medium text-[8px] md:text-[10px] transition-all duration-300 ease-in-out overflow-hidden mx-4 cursor-pointer hover:text-pink-400"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{t("recentChats.title")}</span>
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
          className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Branches List */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-1 space-y-1 max-h-[280px] overflow-y-auto fantasy-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 border-t-pink-400 border-r-pink-300 border-b-pink-200 border-l-transparent animate-spin" />
            </div>
          ) : branches.length === 0 ? (
            <div className={`text-center py-4 text-[#6b6b6b] text-xs ${fontClass}`}>
              {t("recentChats.noChats")}
            </div>
          ) : (
            branches.map((branch) => (
              <div
                key={branch.nodeId}
                className={`group relative p-2 rounded-md cursor-pointer transition-all duration-300 ${branch.isCurrent ? "bg-pink-500/10 border border-pink-500/30" : "hover:bg-[#252525] border border-transparent hover:border-[#333333]"}`}
                onClick={() => !branch.isCurrent && handleBranchClick(branch.nodeId)}
              >
                {/* Hover gradient effect */}
                {!branch.isCurrent && (
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                {/* Content */}
                <div className="relative z-10">
                  {/* Title and badge row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Branch icon */}
                      <div
                        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded ${
                          branch.isCurrent
                            ? "text-pink-400"
                            : "text-[#6b6b6b] group-hover:text-pink-300"
                        } transition-colors duration-300`}
                      >
                        {switchingBranchId === branch.nodeId ? (
                          <div className="w-3 h-3 rounded-full border-2 border-t-pink-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                        ) : (
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
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        )}
                      </div>

                      {/* Title */}
                      <span
                        className={`text-xs truncate ${
                          branch.isCurrent ? "text-pink-300" : "text-[#d4d4d4] group-hover:text-[#f4e8c1]"
                        } transition-colors duration-300 ${fontClass}`}
                      >
                        {branch.title || t("recentChats.untitled")}
                      </span>
                    </div>

                    {/* Message count badge */}
                    <div
                      className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                        branch.isCurrent
                          ? "bg-pink-500/20 text-pink-300"
                          : "bg-[#333333] text-[#8a8a8a] group-hover:bg-[#444444]"
                      } transition-colors duration-300`}
                    >
                      {branch.messageCount}
                    </div>
                  </div>

                  {/* Preview text */}
                  {branch.preview && (
                    <p
                      className={`mt-1 text-[10px] line-clamp-2 ${
                        branch.isCurrent ? "text-pink-200/60" : "text-[#6b6b6b]"
                      } ${fontClass}`}
                    >
                      {branch.preview}
                    </p>
                  )}

                  {/* Current indicator */}
                  {branch.isCurrent && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-pink-400 rounded-full" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mx-4 menu-divider my-2" />
    </div>
  );
};

export default RecentChatsList;
