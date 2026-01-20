import {
  readData,
  writeData,
  PERSONA_FILE,
  PERSONA_SETTINGS_FILE,
} from "@/lib/data/local-storage";
import {
  Persona,
  PersonaSettings,
  createEmptyPersona,
  createDefaultPersona,
} from "@/lib/models/persona-model";

export async function getAllPersonas(): Promise<Persona[]> {
  const personas = await readData(PERSONA_FILE);
  return personas as Persona[];
}

export async function getPersonaById(id: string): Promise<Persona | null> {
  const personas = await getAllPersonas();
  return personas.find((p) => p.id === id) || null;
}

export async function getDefaultPersona(): Promise<Persona | null> {
  const personas = await getAllPersonas();
  return personas.find((p) => p.isDefault) || personas[0] || null;
}

export async function savePersona(persona: Persona): Promise<void> {
  const personas = await getAllPersonas();
  const index = personas.findIndex((p) => p.id === persona.id);

  persona.updatedAt = new Date().toISOString();

  if (index >= 0) {
    personas[index] = persona;
  } else {
    personas.push(persona);
  }

  if (persona.isDefault) {
    personas.forEach((p) => {
      if (p.id !== persona.id) {
        p.isDefault = false;
      }
    });
  }

  await writeData(PERSONA_FILE, personas);
}

export async function deletePersona(id: string): Promise<void> {
  const personas = await getAllPersonas();
  const filtered = personas.filter((p) => p.id !== id);

  if (filtered.length > 0 && !filtered.some((p) => p.isDefault)) {
    filtered[0].isDefault = true;
  }

  await writeData(PERSONA_FILE, filtered);

  const settings = await getPersonaSettings();
  if (settings.defaultPersonaId === id) {
    settings.defaultPersonaId = filtered[0]?.id || null;
  }
  Object.keys(settings.characterPersonaMap).forEach((charId) => {
    if (settings.characterPersonaMap[charId] === id) {
      delete settings.characterPersonaMap[charId];
    }
  });
  await savePersonaSettings(settings);
}

export async function setDefaultPersona(id: string): Promise<void> {
  const personas = await getAllPersonas();

  personas.forEach((p) => {
    p.isDefault = p.id === id;
    p.updatedAt = new Date().toISOString();
  });

  await writeData(PERSONA_FILE, personas);

  const settings = await getPersonaSettings();
  settings.defaultPersonaId = id;
  await savePersonaSettings(settings);
}

export async function getPersonaSettings(): Promise<PersonaSettings> {
  const settings = await readData(PERSONA_SETTINGS_FILE);
  if (settings.length === 0) {
    return {
      defaultPersonaId: null,
      characterPersonaMap: {},
    };
  }
  return settings[0] as PersonaSettings;
}

export async function savePersonaSettings(
  settings: PersonaSettings,
): Promise<void> {
  await writeData(PERSONA_SETTINGS_FILE, [settings]);
}

export async function getPersonaForCharacter(
  characterId: string,
): Promise<Persona | null> {
  const settings = await getPersonaSettings();
  const personaId = settings.characterPersonaMap[characterId];

  if (personaId) {
    return getPersonaById(personaId);
  }

  return getDefaultPersona();
}

export async function setPersonaForCharacter(
  characterId: string,
  personaId: string | null,
): Promise<void> {
  const settings = await getPersonaSettings();

  if (personaId) {
    settings.characterPersonaMap[characterId] = personaId;
  } else {
    delete settings.characterPersonaMap[characterId];
  }

  await savePersonaSettings(settings);
}

export async function initializeDefaultPersona(
  username: string,
): Promise<Persona> {
  const personas = await getAllPersonas();

  if (personas.length === 0) {
    const defaultPersona = createDefaultPersona(username);
    await savePersona(defaultPersona);

    const settings = await getPersonaSettings();
    settings.defaultPersonaId = defaultPersona.id;
    await savePersonaSettings(settings);

    return defaultPersona;
  }

  return personas.find((p) => p.isDefault) || personas[0];
}

export async function createNewPersona(name: string): Promise<Persona> {
  const persona = createEmptyPersona();
  persona.name = name;
  await savePersona(persona);
  return persona;
}
