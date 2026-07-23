import argon2 from "argon2";

const passwordHashOptions = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
} as const;

export async function hashPasswordArgon2id(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("Password must contain at least 12 characters");
  }
  return argon2.hash(password, passwordHashOptions);
}

export async function verifyPasswordArgon2id(
  passwordHash: string,
  candidatePassword: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, candidatePassword);
  } catch {
    return false;
  }
}

export function passwordHashNeedsUpgrade(passwordHash: string): boolean {
  return argon2.needsRehash(passwordHash, passwordHashOptions);
}
