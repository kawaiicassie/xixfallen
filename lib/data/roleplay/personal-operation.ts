import {
  readData,
  writeData,
  PERSONAL_FILE,
  PERSONAL_SETTINGS_FILE,
} from "@/lib/data/local-storage";
import {
  Personal,
  PersonalSettings,
  createEmptyPersonal,
  createDefaultPersonal,
} from "@/lib/models/personal-model";

export async function getAllPersonals(): Promise<Personal[]> {
  const personals = await readData(PERSONAL_FILE);
  return personals as Personal[];
}

export async function getPersonalById(id: string): Promise<Personal | null> {
  const personals = await getAllPersonals();
  return personals.find((p) => p.id === id) || null;
}

export async function getDefaultPersonal(): Promise<Personal | null> {
  const personals = await getAllPersonals();
  return personals.find((p) => p.isDefault) || personals[0] || null;
}

export async function savePersonal(personal: Personal): Promise<void> {
  const personals = await getAllPersonals();
  const index = personals.findIndex((p) => p.id === personal.id);

  personal.updatedAt = new Date().toISOString();

  if (index >= 0) {
    personals[index] = personal;
  } else {
    personals.push(personal);
  }

  if (personal.isDefault) {
    personals.forEach((p) => {
      if (p.id !== personal.id) {
        p.isDefault = false;
      }
    });
  }

  await writeData(PERSONAL_FILE, personals);
}

export async function deletePersonal(id: string): Promise<void> {
  const personals = await getAllPersonals();
  const filtered = personals.filter((p) => p.id !== id);

  if (filtered.length > 0 && !filtered.some((p) => p.isDefault)) {
    filtered[0].isDefault = true;
  }

  await writeData(PERSONAL_FILE, filtered);

  const settings = await getPersonalSettings();
  if (settings.defaultPersonalId === id) {
    settings.defaultPersonalId = filtered[0]?.id || null;
  }
  Object.keys(settings.characterPersonalMap).forEach((charId) => {
    if (settings.characterPersonalMap[charId] === id) {
      delete settings.characterPersonalMap[charId];
    }
  });
  await savePersonalSettings(settings);
}

export async function setDefaultPersonal(id: string): Promise<void> {
  const personals = await getAllPersonals();

  personals.forEach((p) => {
    p.isDefault = p.id === id;
    p.updatedAt = new Date().toISOString();
  });

  await writeData(PERSONAL_FILE, personals);

  const settings = await getPersonalSettings();
  settings.defaultPersonalId = id;
  await savePersonalSettings(settings);
}

export async function getPersonalSettings(): Promise<PersonalSettings> {
  const settings = await readData(PERSONAL_SETTINGS_FILE);
  if (settings.length === 0) {
    return {
      defaultPersonalId: null,
      characterPersonalMap: {},
    };
  }
  return settings[0] as PersonalSettings;
}

export async function savePersonalSettings(
  settings: PersonalSettings,
): Promise<void> {
  await writeData(PERSONAL_SETTINGS_FILE, [settings]);
}

export async function getPersonalForCharacter(
  characterId: string,
): Promise<Personal | null> {
  const settings = await getPersonalSettings();
  const personalId = settings.characterPersonalMap[characterId];

  if (personalId) {
    return getPersonalById(personalId);
  }

  return getDefaultPersonal();
}

export async function setPersonalForCharacter(
  characterId: string,
  personalId: string | null,
): Promise<void> {
  const settings = await getPersonalSettings();

  if (personalId) {
    settings.characterPersonalMap[characterId] = personalId;
  } else {
    delete settings.characterPersonalMap[characterId];
  }

  await savePersonalSettings(settings);
}

export async function initializeDefaultPersonal(
  username: string,
): Promise<Personal> {
  const personals = await getAllPersonals();

  if (personals.length === 0) {
    const defaultPersonal = createDefaultPersonal(username);
    await savePersonal(defaultPersonal);

    const settings = await getPersonalSettings();
    settings.defaultPersonalId = defaultPersonal.id;
    await savePersonalSettings(settings);

    return defaultPersonal;
  }

  return personals.find((p) => p.isDefault) || personals[0];
}

export async function createNewPersonal(name: string): Promise<Personal> {
  const personal = createEmptyPersonal();
  personal.name = name;
  await savePersonal(personal);
  return personal;
}
