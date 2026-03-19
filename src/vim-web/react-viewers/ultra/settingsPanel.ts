import { GenericEntryType } from '../generic/genericField'
import { getIsolationSettings } from "../settings/settingsPanelContent";
import { IsolationApi } from "../state/sharedIsolation";

export function getUltraSettingsContent(isolation: IsolationApi): GenericEntryType[] {
  return getIsolationSettings(isolation)
}
