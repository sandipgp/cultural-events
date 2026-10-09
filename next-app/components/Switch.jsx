// Small reusable toggle switch.
export default function Switch({ on, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`switch ${on ? 'on' : ''}`}
      onClick={onToggle}
    >
      <span className="switch-knob" />
    </button>
  )
}
