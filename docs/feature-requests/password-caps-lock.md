# FR-76-02 — `strct-password`: say when Caps Lock is on

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
