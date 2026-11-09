# FR-76-02 — `strct-password`: say when Caps Lock is on

> **CLOSED, 2026-11-09.** Shipped in **v7.11.0**, all three parts: the hint, `capsLockText` to
> rename it, and `(capsLock)` as an output. Nothing is said before a key is typed, and the change is
> reported once per change rather than once per key.
>
> The acceptance asked for the hint to be in the field's `aria-describedby`, and that turned out to
> be the hard half. **`strct-field` writes `aria-describedby` whole**, so a control describing itself
> had its description replaced by the field's and never read — which is why your workaround had to
> put the words in the field's `hint` in the first place. A control now declares its own with
> `data-strct-described-by` and the field adds it to the list. That fix is not specific to this
> component: anything that knows something about itself the field cannot know now keeps it.
>
> 6 specs on the password and 1 on the field, including the key-up case — the key that turns Caps
> Lock on reports the old state on the way down and the new one on the way back up.

**Filed by:** HyperStruct, 2026-11-06, against **7.9.1** (O480 sign-in page). HyperStruct reads
`KeyboardEvent.getModifierState('CapsLock')` from the keys typed into the field and puts "Caps Lock is
on." into the surrounding `strct-field`'s `hint` (marked workaround).

## Ask

`strct-password` notices Caps Lock from its own key events and shows a hint under the field ("Caps
Lock is on", localisable via an input), announced politely; `capsLock` as an output signal for a
consumer that wants its own words. Nothing is shown before a key is typed (the state cannot be read
earlier).

## Acceptance

Typing with Caps Lock on shows the hint; turning it off removes it; the hint is in the field's
`aria-describedby`.
