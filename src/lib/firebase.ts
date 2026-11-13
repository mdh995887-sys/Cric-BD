import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Channel } from '../types/channel';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore appears offline. Please check Firebase configuration.');
    }
    return false;
  }
}

export async function signInAdminWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAdmin() {
  await signOut(auth);
}

const sanitizeChannelId = (rawId: string): string => {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `ch_${Date.now()}`;
};

const clampStr = (val: string | undefined, max: number): string | undefined => {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
};

export interface PersistedChannelRecord extends Channel {
  deleted?: boolean;
}

export function subscribeToChannels(
  onData: (records: PersistedChannelRecord[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'channels';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PersistedChannelRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && typeof d.name === 'string' && typeof d.streamUrl === 'string') {
          list.push({
            id: String(d.id || docSnap.id),
            name: d.name,
            category: typeof d.category === 'string' ? d.category : 'Sports',
            logo: typeof d.logo === 'string' ? d.logo : '',
            mobileImage: typeof d.mobileImage === 'string' ? d.mobileImage : undefined,
            streamUrl: d.streamUrl,
            backupStreamUrl: typeof d.backupStreamUrl === 'string' ? d.backupStreamUrl : undefined,
            server3StreamUrl: typeof d.server3StreamUrl === 'string' ? d.server3StreamUrl : undefined,
            status:
              d.status === 'offline' || d.status === 'checking' ? d.status : 'online',
            isLive: Boolean(d.isLive),
            sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : undefined,
            deleted: Boolean(d.deleted),
          });
        }
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Already logged
      }
    }
  );
}

export async function saveChannelToFirestore(channel: PersistedChannelRecord): Promise<void> {
  const id = sanitizeChannelId(channel.id);
  const path = `channels/${id}`;
  const docRef = doc(db, 'channels', id);

  try {
    const existingSnap = await getDoc(docRef);
    const payload: Record<string, unknown> = {
      id,
      name: clampStr(channel.name, 120) || 'Untitled Channel',
      category: clampStr(channel.category, 50) || 'Sports',
      logo: clampStr(channel.logo, 240000) || '',
      streamUrl: clampStr(channel.streamUrl, 2048) || '',
      status: channel.status === 'offline' || channel.status === 'checking' ? channel.status : 'online',
      isLive: Boolean(channel.isLive),
      updatedAt: serverTimestamp(),
    };

    const mobileImg = clampStr(channel.mobileImage, 240000);
    if (mobileImg !== undefined) payload.mobileImage = mobileImg;

    const backupUrl = clampStr(channel.backupStreamUrl, 2048);
    if (backupUrl !== undefined) payload.backupStreamUrl = backupUrl;

    const server3Url = clampStr(channel.server3StreamUrl, 2048);
    if (server3Url !== undefined) payload.server3StreamUrl = server3Url;

    if (typeof channel.sortOrder === 'number') {
      payload.sortOrder = channel.sortOrder;
    }
    if (typeof channel.deleted === 'boolean') {
      payload.deleted = channel.deleted;
    }

    if (existingSnap.exists()) {
      const prevData = existingSnap.data();
      payload.createdAt = prevData?.createdAt || serverTimestamp();
      if (prevData?.createdBy) {
        payload.createdBy = prevData.createdBy;
      }
      await setDoc(docRef, payload, { merge: false });
    } else {
      payload.createdAt = serverTimestamp();
      if (auth.currentUser?.uid) {
        payload.createdBy = auth.currentUser.uid;
      }
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteChannelFromFirestore(channelId: string): Promise<void> {
  const id = sanitizeChannelId(channelId);
  const path = `channels/${id}`;
  try {
    await deleteDoc(doc(db, 'channels', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
