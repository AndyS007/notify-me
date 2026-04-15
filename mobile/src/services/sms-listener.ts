import { Platform } from 'react-native';
// The library ships no TypeScript declarations; per project convention we do
// not fabricate one — everything below is typed as `any`.
// @ts-expect-error — untyped third-party module
import { checkIfHasSMSPermission, requestReadSMSPermission, startReadSMS, stopReadSMS } from '@maniac-tech/react-native-expo-read-sms';
import { saveSms } from './sms-service';

export type SmsPermissionStatus = {
  hasReceiveSmsPermission: boolean;
  hasReadSmsPermission: boolean;
};

/**
 * Returns the current Android SMS permission state.
 * On non-Android platforms both flags are false (SMS listening is Android-only).
 */
export async function getSmsPermissionStatus(): Promise<SmsPermissionStatus> {
  if (Platform.OS !== 'android') {
    return { hasReceiveSmsPermission: false, hasReadSmsPermission: false };
  }
  return checkIfHasSMSPermission();
}

/**
 * Requests READ_SMS / RECEIVE_SMS at runtime via the native dialog.
 * Returns true when both permissions are granted.
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  return requestReadSMSPermission();
}

/**
 * The native module delivers each SMS as the output of Java's
 * `Arrays.toString(new String[]{ address, body })`, e.g.
 * `"[+15551234567, hello world]"`. Parse it into the two fields.
 */
function parseNativeSmsPayload(raw: string): { address: string; body: string } {
  // Strip leading "[" and trailing "]"
  let inner = raw;
  if (inner.startsWith('[') && inner.endsWith(']')) {
    inner = inner.slice(1, -1);
  }
  // Arrays.toString uses ", " as the separator. The body can itself contain
  // commas, so split on the FIRST ", " only.
  const sepIdx = inner.indexOf(', ');
  if (sepIdx === -1) {
    return { address: inner.trim(), body: '' };
  }
  const address = inner.slice(0, sepIdx).trim();
  const body = inner.slice(sepIdx + 2);
  return {
    address: address === 'null' ? '' : address,
    body: body === 'null' ? '' : body,
  };
}

let listening = false;

/**
 * Starts listening for inbound SMS. Idempotent — a second call is a no-op.
 * Returns true when the listener is actively running (permission granted).
 */
export async function startSmsListener(
  onMessage?: () => void,
): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (listening) return true;

  const { hasReadSmsPermission, hasReceiveSmsPermission } =
    await getSmsPermissionStatus();
  if (!hasReadSmsPermission || !hasReceiveSmsPermission) return false;

  startReadSMS((status: string, sms: string) => {
    if (status !== 'success' || typeof sms !== 'string' || !sms) return;
    try {
      const { address, body } = parseNativeSmsPayload(sms);
      saveSms({ address, body, timestamp: Date.now() })
        .then(() => onMessage?.())
        .catch((err) => console.log('SMS save error', err));
    } catch (err) {
      console.log('SMS parse error', err);
    }
  });

  listening = true;
  return true;
}

export function stopSmsListener(): void {
  if (Platform.OS !== 'android') return;
  if (!listening) return;
  stopReadSMS();
  listening = false;
}

export function isSmsListenerActive(): boolean {
  return listening;
}
