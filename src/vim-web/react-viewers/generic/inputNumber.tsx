import { useRef, useState, useSyncExternalStore, useEffect } from "react";
import { GenericNumberEntry } from "./genericField";

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

  return (
    <input
      disabled={entry.enabled?.() === false}
      type="number"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
      min={entry.min}
      max={entry.max}
      step={entry.step}
    />
  );
}
