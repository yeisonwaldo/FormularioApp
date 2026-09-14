export type AppUser = {
  email: string;
  password: string;
  name: string;
};

export const TEST_USER: AppUser = {
  email: 'prueba@tdea.com',
  password: '123456',
  name: 'Usuario de prueba',
};

const users: AppUser[] = [{ ...TEST_USER }];

export function findUserByEmail(email: string): AppUser | undefined {
  return users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
}

export function authenticate(email: string, password: string): AppUser | null {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return null;
  }
  return user;
}

export function registerUser(user: AppUser): { ok: true } | { ok: false; message: string } {
  if (findUserByEmail(user.email)) {
    return { ok: false, message: 'Ya existe una cuenta con este correo.' };
  }

  users.push({
    ...user,
    email: user.email.trim().toLowerCase(),
  });

  return { ok: true };
}
