import React, { createContext, useContext } from 'react';
import { en, Translations } from './en';

const I18nContext = createContext<Translations>(en);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(I18nContext.Provider, { value: en }, children);
}

export function useTranslation(): Translations {
  return useContext(I18nContext);
}
