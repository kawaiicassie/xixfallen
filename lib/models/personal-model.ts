/**
 * Personal Model - Định nghĩa cấu trúc dữ liệu cho Personal (User Persona)
 *
 * Personal cho phép user tạo nhiều persona khác nhau để roleplay với các character.
 * Mỗi Personal có thể được gán làm default hoặc áp dụng riêng cho từng character.
 */

export interface Personal {
  id: string;
  name: string;
  description: string;
  personality: string;
  avatar?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalSettings {
  defaultPersonalId: string | null;
  characterPersonalMap: Record<string, string>;
}

export function createEmptyPersonal(): Personal {
  const now = new Date().toISOString();
  return {
    id: `personal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: "",
    description: "",
    personality: "",
    avatar: undefined,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultPersonal(username: string): Personal {
  const now = new Date().toISOString();
  return {
    id: `personal_default_${Date.now()}`,
    name: username || "User",
    description: "",
    personality: "",
    avatar: undefined,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}
