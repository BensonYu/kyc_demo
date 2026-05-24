import { Directory, File, Paths } from 'expo-file-system';

export function ensureSessionDirectory(sessionId: string): Directory {
  const directory = new Directory(Paths.cache, 'kyc-demo', sessionId);
  directory.create({ intermediates: true, idempotent: true });

  return directory;
}

export async function copyArtifactToSession(uri: string, sessionId: string, fileName: string): Promise<string> {
  const directory = await ensureSessionDirectory(sessionId);
  const source = new File(uri);
  const destination = new File(directory, fileName);

  await source.copy(destination, { overwrite: true });
  return destination.uri;
}
