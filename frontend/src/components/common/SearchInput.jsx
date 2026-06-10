import { useEffect, useId, useState } from "react";
import { Button } from "./Button.jsx";

export function SearchInput({ label, value = "", onSearch, placeholder = "Search" }) {
  const [draft, setDraft] = useState(value);
  const id = useId();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function submit(event) {
    event.preventDefault();
    onSearch(draft.trim());
  }

  function clearSearch() {
    setDraft("");
    onSearch("");
  }

  return (
    <form className="field search-field" role="search" onSubmit={submit}>
      <label htmlFor={id}>{label}</label>
      <div className="search-control">
        <input
          id={id}
          className="input"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
        />
        <Button size="small" type="submit">
          Search
        </Button>
        {draft ? (
          <Button size="small" variant="secondary" type="button" onClick={clearSearch}>
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  );
}
