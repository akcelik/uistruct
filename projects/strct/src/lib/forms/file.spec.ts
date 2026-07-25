import { TestBed } from '@angular/core/testing';
import { StrctFile } from './file';

describe('StrctFile', () => {
  it('applies the strct-file host class', () => {
    const fixture = TestBed.createComponent(StrctFile);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-file');
  });

  it('implements CVA', () => {
    const fixture = TestBed.createComponent(StrctFile);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    expect(typeof cmp.writeValue).toBe('function');
    expect(typeof cmp.registerOnChange).toBe('function');
    expect(typeof cmp.registerOnTouched).toBe('function');
  });

  it('resets the native input value so the same file can be re-picked', () => {
    const fixture = TestBed.createComponent(StrctFile);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    const target = { files: [file], value: 'C:\\fakepath\\a.txt' } as unknown as HTMLInputElement;
    cmp.onSelect({ target } as unknown as Event);
    expect(cmp.files()).toEqual([file]);
    expect(target.value).toBe('');
  });

  it('opens the native picker on Space and prevents default', () => {
    const fixture = TestBed.createComponent(StrctFile);
    fixture.detectChanges();
    const zone = fixture.nativeElement.querySelector('.strct-file__zone') as HTMLElement;
    const native = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(native, 'click');
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    zone.dispatchEvent(event);
    expect(clickSpy).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('filters dropped files by accept', () => {
    const fixture = TestBed.createComponent(StrctFile);
    const cmp = fixture.componentInstance;
    fixture.componentRef.setInput('accept', 'image/*');
    fixture.detectChanges();
    const img = new File(['x'], 'a.png', { type: 'image/png' });
    const doc = new File(['x'], 'b.txt', { type: 'text/plain' });
    cmp.onDrop({
      preventDefault: () => {},
      dataTransfer: { files: [img, doc] },
    } as unknown as DragEvent);
    expect(cmp.files()).toEqual([img]);
  });

  it('renders the default localized labels', () => {
    const fixture = TestBed.createComponent(StrctFile);
    fixture.detectChanges();
    const prompt = fixture.nativeElement.querySelector('.strct-file__prompt') as HTMLElement;
    expect(prompt.textContent).toContain('Drag files here');
    expect(prompt.textContent).toContain('browse');
  });

  it('uses localized labels when provided', () => {
    const fixture = TestBed.createComponent(StrctFile);
    fixture.componentRef.setInput('dropLabel', 'Déposez les fichiers ici');
    fixture.componentRef.setInput('browseLabel', 'parcourir');
    fixture.componentRef.setInput('removeLabel', 'Supprimer');
    fixture.componentInstance.writeValue([new File(['x'], 'a.txt', { type: 'text/plain' })]);
    fixture.detectChanges();
    const prompt = fixture.nativeElement.querySelector('.strct-file__prompt') as HTMLElement;
    const remove = fixture.nativeElement.querySelector('.strct-file__remove') as HTMLElement;
    expect(prompt.textContent).toContain('Déposez les fichiers ici');
    expect(prompt.textContent).toContain('parcourir');
    expect(remove.getAttribute('aria-label')).toBe('Supprimer');
  });
});
