import DeviceInfo from 'react-native-device-info';
import { apiPost } from './api';

export async function registerDevice(token: string): Promise<void> {
  const [deviceId, deviceName, brand, model, osName, osVersion, appVersion] = await Promise.all([
    DeviceInfo.getUniqueId(),
    DeviceInfo.getDeviceName(),
    Promise.resolve(DeviceInfo.getBrand()),
    Promise.resolve(DeviceInfo.getModel()),
    Promise.resolve(DeviceInfo.getSystemName()),
    Promise.resolve(DeviceInfo.getSystemVersion()),
    Promise.resolve(DeviceInfo.getVersion()),
  ]);

  await apiPost('/devices/register', {
    deviceId,
    deviceName,
    brand,
    model,
    osName,
    osVersion,
    appVersion,
  }, token);
}
