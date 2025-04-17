import { useEffect, useImperativeHandle, useRef, useState } from "react";

export interface Customizer<TData> {
  customize(fn: (entries: TData) => TData);
}

export function useCustomizer<TData>(
  baseEntries: TData,
  ref: React.Ref<Customizer<TData>>
) {
  const customization = useRef<(entries: TData) => TData>();
  const [entries, setEntries] = useState<TData>(baseEntries);

  const applyCustomization = () => {
    setEntries(customization.current ? customization.current(baseEntries) : baseEntries);
  };

  const setCustomization = (fn: (entries: TData) => TData) => {
    customization.current = fn;
    applyCustomization();
  };

  useEffect(() => {
    applyCustomization();
  }, [baseEntries]);

  useImperativeHandle(ref, () => ({
    customize: setCustomization
  }));

  return entries;
}