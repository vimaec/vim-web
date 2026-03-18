import { useRef, useState, useSyncExternalStore, useEffect } from "react";
import { GenericNumberEntry } from "./genericField";
import { Input } from '../components'

export function InputNumber(props: {entry : GenericNumberEntry}) {
  const entry = props.entry;
  const state = entry.state;
  const defaultValue = useRef(props.entry.state.get());

  const externalValue = useSyncExternalStore(
    (callback) => state.onChange.subscribe(callback),
    () => state.get()
  );

  const [inputValue, setInputValue] = useState(externalValue.toString());

  // Only update inputValue if it no longer matches the external numeric value
  useEffect(() => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed !== externalValue) {
      setInputValue(externalValue.toString());
    }
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);

    const parsed = parseFloat(input);
    if (!isNaN(parsed)) {
      state.set(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    const value = isNaN(parsed) ? defaultValue.current : parsed;
    
    state.set(value);
    setInputValue(state.get().toString());
  };

  const InputAny = Input as any
  return (
    <InputAny
      type="number"
      disabled={entry.enabled?.() === false}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={entry.min}
      max={entry.max}
      step={entry.step}
    />
  );
}
