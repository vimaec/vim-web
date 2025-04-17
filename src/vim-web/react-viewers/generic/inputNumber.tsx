import { useRef, useState, useSyncExternalStore, useEffect } from "react";
import { StateRef } from "../helpers/reactUtils";

export function InputNumber(props: { state: StateRef<number>, disabled?: boolean }) {
  const defaultValue = useRef(props.state.get());

  const externalValue = useSyncExternalStore(
    (callback) => props.state.onChange.subscribe(callback),
    () => props.state.get()
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
      props.state.set(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    const value = isNaN(parsed) ? defaultValue.current : parsed;
    
    props.state.set(value);
    setInputValue(props.state.get().toString());
  };

  return (
    <input
      disabled={props.disabled ?? false}
      type="number"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="vc-border vc-inline vc-border-gray-300 vc-py-1 vc-w-full vc-px-1"
    />
  );
}
