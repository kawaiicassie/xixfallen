/**
 * Persona Model - Định nghĩa cấu trúc dữ liệu cho Persona (User Persona)
 *
 * Persona cho phép user tạo nhiều persona khác nhau để roleplay với các character.
 * Mỗi Persona có thể được gán làm default hoặc áp dụng riêng cho từng character.
 */

export interface Persona {
  id: string;
  name: string;
  description: string; // Combined description including appearance, background, personality
  avatar?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaSettings {
  defaultPersonaId: string | null;
  characterPersonaMap: Record<string, string>; // Maps character ID to persona ID
}

export function createEmptyPersona(): Persona {
  const now = new Date().toISOString();
  return {
    id: `persona_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: "",
    description: "",
    avatar: undefined,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultPersona(username: string): Persona {
  const now = new Date().toISOString();
  return {
    id: `persona_default_${Date.now()}`,
    name: username || "User",
    description: "",
    avatar: undefined,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}
